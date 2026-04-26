import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16_384,
  maxmem: 32 * 1024 * 1024,
  p: 1,
  r: 8,
};

function derivePasswordKey(password, salt) {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      SCRYPT_OPTIONS,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

function promptHidden(label) {
  return new Promise((resolve, reject) => {
    if (!input.isTTY || !output.isTTY) {
      reject(new Error("Abra este comando em um terminal interativo."));
      return;
    }

    let value = "";

    output.write(label);
    input.setEncoding("utf8");
    input.resume();
    input.setRawMode(true);

    const cleanup = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);
    };

    const onData = (chunk) => {
      const key = String(chunk);

      if (key === "\u0003") {
        cleanup();
        output.write("\n");
        reject(new Error("Operacao cancelada."));
        return;
      }

      if (key === "\r" || key === "\n") {
        cleanup();
        output.write("\n");
        resolve(value);
        return;
      }

      if (key === "\u0008" || key === "\u007f") {
        if (value.length > 0) {
          value = value.slice(0, -1);
        }

        return;
      }

      value += key;
    };

    input.on("data", onData);
  });
}

try {
  const password = await promptHidden("Digite a nova senha: ");

  if (!password.trim()) {
    throw new Error("A senha nao pode ficar vazia.");
  }

  const confirmation = await promptHidden("Confirme a nova senha: ");

  if (password !== confirmation) {
    throw new Error("As senhas nao conferem.");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = await derivePasswordKey(password, salt);
  const hash = `${salt}:${derivedKey.toString("hex")}`;

  output.write("\nHash gerada com sucesso.\n");
  output.write("Cole este valor no campo password_hash:\n\n");
  output.write(`${hash}\n\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Falha ao gerar a hash.");
  process.exitCode = 1;
}
