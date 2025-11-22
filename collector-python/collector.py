import os
import json
import requests
import pika
import schedule
import time
from dotenv import load_dotenv
from messages import (
    MSG_FETCHING_WEATHER,
    MSG_API_ERROR,
    MSG_NO_CURRENT_DATA,
    MSG_WEATHER_COLLECTED,
    MSG_QUEUE_SUCCESS,
    MSG_QUEUE_ERROR,
    MSG_COLLECTOR_STARTING
)

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
QUEUE_NAME = "weather_queue"

LAT = -12.9777
LON = -38.5016

def get_weather():
    """Consulta a API de clima e retorna um dicionário padronizado."""
    url = f"https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&current_weather=true"
    print(MSG_FETCHING_WEATHER)

    r = requests.get(url, timeout=10)
    if r.status_code != 200:
        print(MSG_API_ERROR.format(r.status_code))
        return None
    
    data = r.json()
    current = data.get("current_weather")
    if not current:
        print(MSG_NO_CURRENT_DATA)
        return None
    
    weather = {
        "timestamp": current["time"],                
        "temperature": current["temperature"],        
        "windSpeed": current["windspeed"],           
        "isDay": current["is_day"] == 1,
        "location": "Salvador, BA"    
    }
    print(MSG_WEATHER_COLLECTED.format(weather))
    return weather

def send_to_queue(data):
    """Envia o JSON coletado para a fila do RabbitMQ."""
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()

        channel.basic_publish(
            exchange="",
            routing_key=QUEUE_NAME,
            body=json.dumps(data),
            properties=pika.BasicProperties(
                delivery_mode=2
            )
        )

        print(MSG_QUEUE_SUCCESS)
        connection.close()
    except Exception as e:
        print(MSG_QUEUE_ERROR.format(e))

def job():
    """Fluxo completo: coletar + enviar."""
    weather = get_weather()
    if weather:
        send_to_queue(weather)

def main():
    # Executar a cada 1 minuto (PARA TESTES)
    schedule.every(1).minutes.do(job)

    print(MSG_COLLECTOR_STARTING)

    job()

    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()