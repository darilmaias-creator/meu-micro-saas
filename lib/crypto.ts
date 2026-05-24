import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY_BYTES = 32;
const IV_LENGTH = 12;
const SERIALIZED_PREFIX = "v1";

function getEncryptionKey() {
  const rawKey = process.env.ENCRYPTION_KEY?.trim();

  if (!rawKey) {
    throw new Error("ENCRYPTION_KEY nao esta configurada.");
  }

  const key = Buffer.from(rawKey, "hex");

  if (key.length !== ENCRYPTION_KEY_BYTES) {
    throw new Error(
      "ENCRYPTION_KEY precisa ter 32 bytes em hexadecimal, ou seja, 64 caracteres.",
    );
  }

  return key;
}

export function encryptSensitiveData(data: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    SERIALIZED_PREFIX,
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptSensitiveData(encryptedData: string) {
  const [version, ivHex, authTagHex, encryptedHex] = encryptedData.split(":");

  if (
    version !== SERIALIZED_PREFIX ||
    !ivHex ||
    !authTagHex ||
    !encryptedHex
  ) {
    throw new Error("Formato de dado criptografado invalido.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
    {
      authTagLength: AUTH_TAG_LENGTH,
    },
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function isEncryptedSensitiveData(value: string | null | undefined) {
  return Boolean(value?.startsWith(`${SERIALIZED_PREFIX}:`));
}

export function safeCompareSensitiveValue(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
