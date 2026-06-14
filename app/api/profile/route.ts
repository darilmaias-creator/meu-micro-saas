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
      return "No plano grátis, o nome só pode ser alterado uma única vez.";
    case "PREMIUM_PHOTO_REQUIRED":
      return "A troca de foto está disponível apenas para usuários premium.";
    case "USER_NOT_FOUND":
      return "Não foi possível localizar o usuário logado.";
    default:
      return "Não foi possível atualizar o perfil.";
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
      { message: "Você precisa estar logado para atualizar o perfil." },
      { status: 401 },
    );
  }

  let body: UpdateProfilePayload;

  try {
    body = (await request.json()) as UpdateProfilePayload;
  } catch {
    return NextResponse.json(
      { message: "Não foi possível ler os dados do perfil." },
      { status: 400 },
    );
  }

  if (body.name !== undefined && typeof body.name !== "string") {
    return NextResponse.json(
      { message: "O nome enviado não está em um formato válido." },
      { status: 400 },
    );
  }

  if (
    body.image !== undefined &&
    body.image !== null &&
    typeof body.image !== "string"
  ) {
    return NextResponse.json(
      { message: "A foto enviada não está em um formato válido." },
      { status: 400 },
    );
  }

  if (!isValidImageValue(body.image)) {
    return NextResponse.json(
      { message: "A imagem informada não está em um formato suportado." },
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
      : "Nenhuma alteração foi feita no perfil.",
    user: getSessionUserFromStoredUser(result.user),
  });
}
