"""Mensagens centralizadas para o coletor de clima."""

# API Requests
MSG_FETCHING_WEATHER = "Buscando clima na Open-Meteo..."
MSG_API_ERROR = "Erro ao consultar API de clima: {}"
MSG_NO_CURRENT_DATA = "Dados de clima atual não encontrados na resposta."
MSG_WEATHER_COLLECTED = "Clima coletado: {}"
# RabbitMQ Operations
MSG_QUEUE_SUCCESS = "Dados enviados para a fila com sucesso."
MSG_QUEUE_ERROR = "Erro ao enviar dados para a fila: {}"
# Application Flow
MSG_COLLECTOR_STARTING = "Iniciando coletor de clima..."
