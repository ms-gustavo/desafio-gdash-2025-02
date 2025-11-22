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
    Timestamp   string  `json:"timestamp"`
    Temperature float64 `json:"temperature"`
    WindSpeed   float64 `json:"windSpeed"`
    IsDay       bool    `json:"isDay"`
    Location    string  `json:"location"`
}

const MaxRetries = 3

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		log.Printf(MsgRabbitMQURLNotDefined)
		rabbitURL = "amqp://guest:guest@rabbitmq:5672/"
	}

	apiURL := os.Getenv("BACKEND_URL")
	if apiURL == "" {
		log.Printf(MsgBackendURLNotDefined)
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
		log.Printf(MsgRabbitMQRetryAttempt, i+1, maxRetries)
		time.Sleep(5 * time.Second)
	}
	
	if err != nil {
		log.Fatalf(MsgRabbitMQConnectionFailed, maxRetries, err)
	}
	defer conn.Close()

	log.Println(MsgRabbitMQConnected)

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf(MsgRabbitMQChannelFailed, err)
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
    log.Fatalf(MsgDLXDeclareError, err)
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
    log.Fatalf(MsgDLQDeclareError, err)
	}

	err = ch.QueueBind(
    dlqName,
    dlqName,
    dlxName,
    false,
    nil,
	)
	if err != nil {
    log.Fatalf(MsgDLQBindError, err)
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
    log.Fatalf(MsgQueueDeclareError, err)
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
		log.Fatalf(MsgQueueConsumeError, err)
	}
	log.Printf(MsgQueueWaiting, q.Name)

	forever := make(chan bool)

	handleRetryOrDlq := func(ch *amqp.Channel, queueName string, msg *amqp.Delivery, retryCount int) {
    if retryCount+1 >= MaxRetries {
        log.Println(MsgSendingToDLQ)
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
        log.Printf(MsgRepublishError, errPub)
        msg.Nack(false, false)
        return
    }

    msg.Ack(false)
    log.Printf(MsgMessageRepublished, retryCount+1)
}

	go func() {
		for msg := range msgs {
    		log.Println(MsgMessageReceived)

    
		retryCount := 0
		if val, ok := msg.Headers["x-retry-count"]; ok {
			if v, okInt := val.(int32); okInt {
				retryCount = int(v)
			} else if vInt, okInt2 := val.(int); okInt2 {
				retryCount = vInt
			}
		}
	
		log.Printf(MsgCurrentAttempt, retryCount+1)
	
		var data WeatherData
	
		if err := json.Unmarshal(msg.Body, &data); err != nil {
			log.Printf(MsgJSONParseError, err)
		
		
			if retryCount+1 >= MaxRetries {
				log.Println(MsgSendingToDLQ)
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
				log.Printf(MsgRepublishError, errPub)
				msg.Nack(false, false)
				continue
			}
		
			msg.Ack(false)
			continue
		}
	
		jsonBody, _ := json.Marshal(data)
	
		req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonBody))
		if err != nil {
			log.Printf(MsgHTTPRequestError, err)
			handleRetryOrDlq(ch, q.Name, &msg, retryCount)
			continue
		}
	
		req.Header.Set("Content-Type", "application/json")
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf(MsgHTTPSendError, err)
			handleRetryOrDlq(ch, q.Name, &msg, retryCount)
			continue
		}
	
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			log.Println(MsgHTTPSuccess)
			msg.Ack(false)
		} else {
			log.Printf(MsgHTTPStatusError, resp.StatusCode)
			handleRetryOrDlq(ch, q.Name, &msg, retryCount)
		}
		resp.Body.Close()
	}
	} ()

	<-forever
}