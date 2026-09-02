// chat.js
// Lógica específica del chat: llamada a nuestra serverless function y
// manejo del estado de una conversación en memoria.

import { buildChatRequestBody } from "./utils.js";

/**
 * Envía un mensaje a /api/chat y devuelve la respuesta del personaje.
 * Lanza un Error con un mensaje amigable si algo falla (red o servidor).
 */
export async function sendMessageToCharacter(characterId, history, message) {
  const body = buildChatRequestBody(characterId, history, message);

  let response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Respuesta inválida del servidor.");
  }

  if (!response.ok) {
    throw new Error(data?.error || "Ocurrió un error al hablar con el personaje.");
  }

  if (!data.reply) {
    throw new Error("El personaje no respondió. Intenta de nuevo.");
  }

  return data.reply;
}
