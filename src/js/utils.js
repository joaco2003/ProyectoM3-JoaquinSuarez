// utils.js
// Funciones puras de transformación/parseo. Sin acceso a DOM ni red directa,
// para que sean fáciles de testear con Vitest.

/**
 * Construye el body que el cliente envía a nuestra propia serverless function.
 * @param {string} characterId
 * @param {Array<{role: 'user'|'model', text: string}>} history
 * @param {string} message
 */
export function buildChatRequestBody(characterId, history, message) {
  if (!characterId) throw new Error("characterId es requerido");
  if (!message || !message.trim()) throw new Error("El mensaje no puede estar vacío");

  return {
    characterId,
    message: message.trim(),
    history: (history || []).map((m) => ({ role: m.role, text: m.text })),
  };
}

/**
 * Transforma la respuesta cruda de la API de Gemini a un string de texto plano.
 * Devuelve null si la estructura no trae texto (contenido bloqueado, etc.)
 */
export function extractGeminiText(geminiResponse) {
  try {
    const candidate = geminiResponse?.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) return null;
    const text = parts.map((p) => p.text || "").join("").trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

/**
 * Convierte el historial interno (role: 'user' | 'model') al formato
 * que espera la API de Gemini (`contents`).
 */
export function toGeminiContents(history, newMessage) {
  const contents = (history || []).map((m) => ({
    role: m.role === "character" ? "model" : "user",
    parts: [{ text: m.text }],
  }));
  contents.push({ role: "user", parts: [{ text: newMessage }] });
  return contents;
}

/**
 * Formatea un timestamp (ms epoch) como hora corta legible, ej "14:35".
 */
export function formatTimestamp(ms) {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Crea un objeto de mensaje normalizado para guardar en el historial.
 */
export function createMessage(role, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role, // 'user' | 'character'
    text,
    timestamp: Date.now(),
  };
}

/**
 * Parsea de forma segura una ruta del navegador a un nombre de vista conocido.
 */
export function parseRoute(pathname) {
  const clean = (pathname || "/").split("?")[0].replace(/\/+$/, "") || "/";
  const known = ["home", "chat", "about"];
  const segment = clean === "/" ? "home" : clean.replace(/^\//, "");
  return known.includes(segment) ? segment : "home";
}

/**
 * Trunca un string a N caracteres agregando "…" si corresponde.
 */
export function truncate(str, maxLen = 60) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen - 1).trimEnd() + "…" : str;
}
