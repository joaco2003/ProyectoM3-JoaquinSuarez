
import { CHARACTERS } from "../src/js/characters.js";

const DEFAULT_MODEL = "gemini-3.6-flash";

async function callGeminiWithRetry(url, payload, maxRetries = 3) {
  let lastRes;

  for (let i = 0; i < maxRetries; i++) {
    lastRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (lastRes.ok) return lastRes;
    if (lastRes.status !== 503) return lastRes; // si es otro error, no reintentar

    console.log(`Intento ${i + 1} falló con 503 (modelo saturado), reintentando...`);
    await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // espera 1s, 2s, 3s
  }

  return lastRes; // se agotaron los reintentos, devolvemos el último intento (fallido)
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Nunca revelamos detalles internos, solo que falta configuración.
    return res.status(500).json({ error: "El servidor no tiene configurada la API key de Gemini." });
  }

  const { characterId, message, history } = req.body || {};

  if (!characterId || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Faltan campos: characterId y message son requeridos." });
  }

  const character = CHARACTERS.find((c) => c.id === characterId);
  if (!character) {
    return res.status(400).json({ error: "Personaje desconocido." });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = (Array.isArray(history) ? history : []).map((m) => ({
    role: m.role === "character" ? "model" : "user",
    parts: [{ text: String(m.text || "") }],
  }));
  contents.push({ role: "user", parts: [{ text: message.trim() }] });

  const payload = {
    system_instruction: {
      parts: [{ text: character.systemPrompt }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 500,
      thinkingConfig: {
        thinkingLevel: "low",
      },
    },
  };

  try {
    const geminiRes = await callGeminiWithRetry(url, payload);

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errBody);

      if (geminiRes.status === 503) {
        return res.status(503).json({ error: "La IA está muy solicitada ahora mismo. Probá de nuevo en unos segundos." });
      }

      return res.status(502).json({ error: "Error al comunicarse con la IA. Intenta nuevamente." });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();

    if (!text) {
      return res.status(502).json({ error: "La IA no devolvió una respuesta válida." });
    }

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error("Error inesperado en /api/chat:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
