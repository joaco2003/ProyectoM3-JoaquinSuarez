import { describe, it, expect } from "vitest";
import {
  buildChatRequestBody,
  extractGeminiText,
  toGeminiContents,
  formatTimestamp,
  createMessage,
  parseRoute,
  truncate,
} from "../src/js/utils.js";

describe("buildChatRequestBody", () => {
  it("construye el body correctamente con historial vacío", () => {
      const body = buildChatRequestBody("naruto", [], "Hola");
      expect(body).toEqual({ characterId: "naruto", message: "Hola", history: [] });
  });

  it("recorta espacios del mensaje", () => {
    const body = buildChatRequestBody("naruto", [], "   Hola Naruto   ");
    expect(body.message).toBe("Hola Naruto");
  });

  it("lanza error si falta characterId", () => {
    expect(() => buildChatRequestBody(null, [], "Hola")).toThrow();
  });

  it("lanza error si el mensaje está vacío o solo tiene espacios", () => {
    expect(() => buildChatRequestBody("naruto", [], "   ")).toThrow();
  });
});

describe("extractGeminiText", () => {
  it("extrae el texto de una respuesta válida de Gemini", () => {
    const response = {
      candidates: [{ content: { parts: [{ text: "¡Voy a ser Hokage, dattebayo!" }] } }],
    };
    expect(extractGeminiText(response)).toBe("¡Voy a ser Hokage, dattebayo!");
  });

  it("une múltiples partes de texto", () => {
    const response = {
      candidates: [{ content: { parts: [{ text: "Hola. " }, { text: "¿Cómo estás?" }] } }],
    };
    expect(extractGeminiText(response)).toBe("Hola. ¿Cómo estás?");
  });

  it("devuelve null si la estructura no tiene candidates", () => {
    expect(extractGeminiText({})).toBeNull();
  });

  it("devuelve null si no hay texto (respuesta bloqueada)", () => {
    const response = { candidates: [{ content: { parts: [] } }] };
    expect(extractGeminiText(response)).toBeNull();
  });
});

describe("toGeminiContents", () => {
  it("mapea 'character' a 'model' y agrega el mensaje nuevo al final", () => {
    const history = [
      { role: "user", text: "Hola" },
      { role: "character", text: "¡Hola! ¿Listo para entrenar?" },
    ];
    const contents = toGeminiContents(history, "¿Cuál es tu sueño?");
    expect(contents).toHaveLength(3);
    expect(contents[1].role).toBe("model");
    expect(contents[2]).toEqual({ role: "user", parts: [{ text: "¿Cuál es tu sueño?" }] });
  });
});

describe("formatTimestamp", () => {
  it("formatea la hora con formato HH:MM", () => {
    const date = new Date(2026, 0, 1, 9, 5);
    expect(formatTimestamp(date.getTime())).toBe("09:05");
  });
});

describe("createMessage", () => {
  it("crea un mensaje con id, role, text y timestamp", () => {
    const msg = createMessage("user", "Hola");
    expect(msg.role).toBe("user");
    expect(msg.text).toBe("Hola");
    expect(typeof msg.id).toBe("string");
    expect(typeof msg.timestamp).toBe("number");
  });
});

describe("parseRoute", () => {
  it("devuelve 'home' para la raíz", () => {
    expect(parseRoute("/")).toBe("home");
  });

  it("reconoce rutas conocidas", () => {
    expect(parseRoute("/chat")).toBe("chat");
    expect(parseRoute("/about")).toBe("about");
  });

  it("devuelve 'home' para rutas desconocidas", () => {
    expect(parseRoute("/no-existe")).toBe("home");
  });

  it("ignora barras finales y query strings", () => {
    expect(parseRoute("/chat/?foo=bar")).toBe("chat");
  });
});

describe("truncate", () => {
  it("no modifica strings más cortos que el límite", () => {
    expect(truncate("Hola", 10)).toBe("Hola");
  });

  it("trunca y agrega elipsis cuando excede el límite", () => {
    expect(truncate("Este es un mensaje muy largo", 10)).toBe("Este es u…");
  });
});
