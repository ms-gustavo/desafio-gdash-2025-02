package main

const (
	// RabbitMQ Connection
	MsgRabbitMQURLNotDefined    = "RABBITMQ_URL não definido, usando padrão."
	MsgRabbitMQConnected        = "Worker GO conectado ao RabbitMQ"
	MsgRabbitMQRetryAttempt     = "Tentativa %d/%d - Aguardando RabbitMQ ficar disponível..."
	MsgRabbitMQConnectionFailed = "Erro ao conectar no RabbitMQ após %d tentativas: %s"
	MsgRabbitMQChannelFailed    = "Erro ao abrir canal: %s"
	// Backend Configuration
	MsgBackendURLNotDefined = "BACKEND_URL não definido, usando padrão."
	// Queue Operations
	MsgQueueDeclareError = "Erro ao declarar fila principal: %s"
	MsgQueueConsumeError = "Erro ao consumir fila: %s"
	MsgQueueWaiting      = "Worker aguardando mensagens na fila '%s'..."
	MsgMessageReceived   = "Mensagem recebida do Python"
	// DLX/DLQ
	MsgDLXDeclareError = "Erro ao declarar DLX: %s"
	MsgDLQDeclareError = "Erro ao declarar DLQ: %s"
	MsgDLQBindError    = "Erro ao fazer bind da DLQ: %s"
	MsgSendingToDLQ    = "Máximo de tentativas atingido. Enviando para DLQ."
	// Message Processing
	MsgCurrentAttempt     = "Tentativa atual: %d\n"
	MsgJSONParseError     = "Erro ao fazer parse JSON: %s"
	MsgRepublishError     = "Erro ao republicar mensagem: %s"
	MsgMessageRepublished = "Mensagem republicada para retry %d\n"
	// HTTP Operations
	MsgHTTPRequestError = "Erro ao criar request: %s"
	MsgHTTPSendError    = "Erro ao enviar pro backend: %s"
	MsgHTTPSuccess      = "Enviado ao backend com sucesso!"
	MsgHTTPStatusError  = "Backend retornou %d — reprocessar ou DLQ"
)
