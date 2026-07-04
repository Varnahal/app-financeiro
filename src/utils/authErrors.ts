const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha inválidos.',
  'User already registered': 'Este e-mail já está cadastrado.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'O e-mail informado não é válido.',
};

export function translateAuthError(message: string | undefined): string {
  if (!message) return 'Ocorreu um erro inesperado. Tente novamente.';
  for (const [key, value] of Object.entries(MESSAGES)) {
    if (message.includes(key)) return value;
  }
  return message;
}
