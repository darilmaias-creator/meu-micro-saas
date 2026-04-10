import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { MAX_PROFILE_IMAGE_DATA_URL_LENGTH } from "@/lib/auth/profile-rules";
import {
  getSessionUserFromStoredUser,
  updateUserProfile,
} from "@/lib/auth/user-store";

type UpdateProfilePayload = {
  name?: string;
  image?: string | null;
};

function getErrorResponseMessage(code: string) {
  switch (code) {
    case "INVALID_NAME":
      return "O nome precisa ter pelo menos 2 caracteres.";
    case "FREE_NAME_CHANGE_LIMIT":
      return "No plano gratis, o nome so pode ser alterado uma unica vez.";
    case "PREMIUM_PHOTO_REQUIRED":
      return "A troca de foto esta disponivel apenas para usuarios premium.";
    case "USER_NOT_FOUND":
      return "Nao foi possivel localizar o usuario logado.";
    default:
      return "Nao foi possivel atualizar o perfil.";
  }
}

function isValidImageValue(image: string | null | undefined) {
  if (image === undefined || image === null) {
    return true;
  }

  if (!image) {
    return true;
  }

  return (
    image.startsWith("data:image/") ||
    image.startsWith("https://") ||
    image.startsWith("http://")
  );
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para atualizar o perfil." },
      { status: 401 },
    );
  }

  let body: UpdateProfilePayload;

  try {
    body = (await request.json()) as UpdateProfilePayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados do perfil." },
      { status: 400 },
    );
  }

  if (body.name !== undefined && typeof body.name !== "string") {
    return NextResponse.json(
      { message: "O nome enviado nao esta em um formato valido." },
      { status: 400 },
    );
  }

  if (
    body.image !== undefined &&
    body.image !== null &&
    typeof body.image !== "string"
  ) {
    return NextResponse.json(
      { message: "A foto enviada nao esta em um formato valido." },
      { status: 400 },
    );
  }

  if (!isValidImageValue(body.image)) {
    return NextResponse.json(
      { message: "A imagem informada nao esta em um formato suportado." },
      { status: 400 },
    );
  }

  if (
    typeof body.image === "string" &&
    body.image.startsWith("data:image/") &&
    body.image.length > MAX_PROFILE_IMAGE_DATA_URL_LENGTH
  ) {
    return NextResponse.json(
      { message: "A foto esta muito grande. Use uma imagem menor." },
      { status: 400 },
    );
  }

  const result = await updateUserProfile({
    userId: session.user.id,
    name: body.name,
    image: body.image,
  });

  if (!result.ok) {
    const status =
      result.code === "USER_NOT_FOUND"
        ? 404
        : result.code === "FREE_NAME_CHANGE_LIMIT" ||
            result.code === "PREMIUM_PHOTO_REQUIRED"
          ? 403
          : 400;

    return NextResponse.json(
      { message: getErrorResponseMessage(result.code) },
      { status },
    );
  }

  return NextResponse.json({
    message: result.changed
      ? "Perfil atualizado com sucesso."
      : "Nenhuma alteracao foi feita no perfil.",
    user: getSessionUserFromStoredUser(result.user),
  });
}
