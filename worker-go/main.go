package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type WeatherData struct {
	Temperature float64 `json:"temperature"`
	Humidity	float64 `json:"humidity"`
	WindSpeed	float64 `json:"windSpeed"`
	Condition   string `json:"condition"`
	RainProbability float64 `json:"rainProbability"`
	Timestamp   string `json:"timestamp"`
	Location	string `json:"location"`
}

const MaxRetries = 3

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@rabbitmq:5672/"
	}

	apiURL := os.Getenv("BACKEND_URL")
	if apiURL == "" {
		apiURL = "http://backend:3000/api/weather/logs"
	}

	var conn *amqp.Connection
	var err error
	maxRetries := 10
	
	for i := 0; i < maxRetries; i++ {
		conn, err = amqp.Dial(rabbitURL)
		if err == nil {
			break
		}
		log.Printf("Tentativa %d/%d - Aguardando RabbitMQ ficar disponível...", i+1, maxRetries)
		time.Sleep(5 * time.Second)
	}
	
	if err != nil {
		log.Fatalf("Erro ao conectar no RabbitMQ após %d tentativas: %s", maxRetries, err)
	}
	defer conn.Close()

	log.Println("Worker GO conectado ao RabbitMQ")

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Erro ao abrir canal: %s", err)
	}
	defer ch.Close()

	dlxName := "weather_dlx"
	dlqName := "weather_dlq"
	
	err = ch.ExchangeDeclare(
    dlxName,
    "direct",
    true,
    false,
    false,
    false,
    nil,
	)
	if err != nil {
    log.Fatalf("Erro ao declarar DLX: %s", err)
	}

	_, err = ch.QueueDeclare(
    dlqName,
    true,
    false,
    false,
    false,
    nil,
	)
	if err != nil {
    log.Fatalf("Erro ao declarar DLQ: %s", err)
	}

	err = ch.QueueBind(
    dlqName,
    dlqName,
    dlxName,
    false,
    nil,
	)
	if err != nil {
    log.Fatalf("Erro ao fazer bind da DLQ: %s", err)
	}

	args := amqp.Table{
    "x-dead-letter-exchange":    dlxName,
    "x-dead-letter-routing-key": dlqName,
	}

	q, err := ch.QueueDeclare(
    "weather_queue",
    true,
    false,
    false,
    false,
    args,
	)
	if err != nil {
    log.Fatalf("Erro ao declarar fila principal: %s", err)
	}

	msgs, err := ch.Consume(
		q.Name,
		"",
		false,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		log.Fatalf("Erro ao consumir fila: %s", err)
	}
	log.Printf("Worker aguardando mensagens na fila '%s'...", q.Name)

	forever := make(chan bool)

	handleRetryOrDlq := func(ch *amqp.Channel, queueName string, msg *amqp.Delivery, retryCount int) {
    if retryCount+1 >= MaxRetries {
        log.Println("Máximo de tentativas atingido. Enviando para DLQ.")
        msg.Nack(false, false)
        return
    }

    errPub := ch.Publish(
        "",
        queueName,
        false,
        false,
        amqp.Publishing{
            ContentType: "application/json",
            Body:        msg.Body,
            Headers: amqp.Table{
                "x-retry-count": int32(retryCount + 1),
            },
        },
    )
    if errPub != nil {
        log.Println("Erro ao republicar mensagem:", errPub)
        msg.Nack(false, false)
        return
    }

    msg.Ack(false)
    log.Printf("Mensagem republicada para retry %d\n", retryCount+1)
}

	go func() {
		for msg := range msgs {
    		log.Println("Mensagem recebida do Python")

    
		retryCount := 0
		if val, ok := msg.Headers["x-retry-count"]; ok {
			if v, okInt := val.(int32); okInt {
				retryCount = int(v)
			} else if vInt, okInt2 := val.(int); okInt2 {
				retryCount = vInt
			}
		}
	
		log.Printf("Tentativa atual: %d\n", retryCount+1)
	
		var data WeatherData
	
		if err := json.Unmarshal(msg.Body, &data); err != nil {
			log.Println("Erro ao fazer parse JSON:", err)
		
		
			if retryCount+1 >= MaxRetries {
				log.Println("Máximo de tentativas atingido. Enviando para DLQ.")
				msg.Nack(false, false)
				continue
			}
		
			errPub := ch.Publish(
				"",
				q.Name,
				false,
				false,
				amqp.Publishing{
					ContentType: "application/json",
					Body:        msg.Body,
					Headers: amqp.Table{
						"x-retry-count": int32(retryCount + 1),
					},
				},
			)
			if errPub != nil {
				log.Println("Erro ao republicar mensagem:", errPub)
				msg.Nack(false, false)
				continue
			}
		
			msg.Ack(false)
			continue
		}
	
		jsonBody, _ := json.Marshal(data)
	
		req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonBody))
		if err != nil {
			log.Println("Erro ao criar request:", err)
			handleRetryOrDlq(ch, q.Name, &msg, retryCount)
			continue
		}
	
		req.Header.Set("Content-Type", "application/json")
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			log.Println("Erro ao enviar pro backend:", err)
			handleRetryOrDlq(ch, q.Name, &msg, retryCount)
			continue
		}
		defer resp.Body.Close()
	
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			log.Println("Enviado ao backend com sucesso!")
			msg.Ack(false)
		} else {
			log.Printf("Backend retornou %d — reprocessar ou DLQ", resp.StatusCode)
			handleRetryOrDlq(ch, q.Name, &msg, retryCount)
		}
		}
	} ()

	<-forever
}