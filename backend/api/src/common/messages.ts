export const ErrorMessages = {
  // User errors
  USER_NOT_FOUND: 'Usuário não encontrado',
  USER_EMAIL_IN_USE: 'E-mail já está em uso',

  // Auth errors
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  UNAUTHORIZED: 'Não autorizado',

  // Weather errors
  WEATHER_NOT_FOUND: 'Dados meteorológicos não encontrados',

  // General errors
  INTERNAL_SERVER_ERROR: 'Erro interno do servidor',
  VALIDATION_ERROR: 'Erro de validação',
  RESOURCE_NOT_FOUND: 'Recurso não encontrado'
} as const;

export const InfoMessages = {
  // User messages
  USER_CREATED: 'Usuário criado com sucesso',
  USER_UPDATED: 'Usuário atualizado com sucesso',
  USER_DELETED: 'Usuário removido com sucesso',
  ADMIN_SEED_SKIPPED:
    'DEFAULT_ADMIN_EMAIL ou DEFAULT_ADMIN_PASSWORD não configurados. Seed ignorado.',
  ADMIN_SEED_SUCCESS: 'Usuário admin padrão criado: {}',

  // Auth messages
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',

  // Weather messages
  WEATHER_CREATED: 'Registro meteorológico criado com sucesso',

  // General messages
  OPERATION_SUCCESS: 'Operação realizada com sucesso'
} as const;

/**
 * Formata uma mensagem substituindo {} pelo valor fornecido
 * @param message Mensagem com placeholder {}
 * @param value Valor para substituir
 */
export function formatMessage(message: string, value: string | number): string {
  return message.replace('{}', String(value));
}
