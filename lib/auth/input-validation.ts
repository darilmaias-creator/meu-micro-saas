const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AUTH_EMAIL_MAX_LENGTH = 254;
export const AUTH_NAME_MIN_LENGTH = 2;
export const AUTH_NAME_MAX_LENGTH = 80;
export const AUTH_PASSWORD_MIN_LENGTH = 6;
export const AUTH_PASSWORD_MAX_LENGTH = 128;

export function normalizeEmailInput(email: string | null | undefined) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function normalizeNameInput(name: string | null | undefined) {
  return typeof name === "string" ? name.trim() : "";
}

export function validateEmailAddress(email: string) {
  if (!email) {
    return "Informe um e-mail valido.";
  }

  if (email.length > AUTH_EMAIL_MAX_LENGTH) {
    return "O e-mail informado e longo demais.";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "Informe um e-mail valido.";
  }

  return null;
}

export function validateName(name: string) {
  if (name.length < AUTH_NAME_MIN_LENGTH) {
    return "Informe um nome com pelo menos 2 caracteres.";
  }

  if (name.length > AUTH_NAME_MAX_LENGTH) {
    return "O nome informado e longo demais.";
  }

  return null;
}

export function validatePasswordForStorage(password: string) {
  if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (password.length > AUTH_PASSWORD_MAX_LENGTH) {
    return "A senha informada e longa demais.";
  }

  return null;
}

export function validatePasswordForLogin(password: string) {
  if (!password) {
    return "Informe sua senha para continuar.";
  }

  if (password.length > AUTH_PASSWORD_MAX_LENGTH) {
    return "A senha informada e longa demais.";
  }

  return null;
}
