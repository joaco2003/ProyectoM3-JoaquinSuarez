import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMessageToCharacter } from "../src/js/chat.js";

describe("sendMessageToCharacter", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve la respuesta del personaje cuando la API responde OK", async () => {
    global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ reply: "¡Mmm... donas! Digo, sí, creo en el destino." }),
  });

    const reply = await sendMessageToCharacter("homero", [], "¿Crees en el destino?");
    expect(reply).toBe("¡Mmm... donas! Digo, sí, creo en el destino.");
  });

  it("envía el body con characterId, message e history serializados", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Ok." }),
    });

    await sendMessageToCharacter("naruto", [{ role: "user", text: "Hola" }], "¿Cómo estás?");

    const [, options] = global.fetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.characterId).toBe("naruto");
    expect(sentBody.history).toEqual([{ role: "user", text: "Hola" }]);
  });

  it("lanza un error amigable cuando la respuesta HTTP no es OK", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "La IA no devolvió una respuesta válida." }),
    });

    await expect(sendMessageToCharacter("holmes", [], "Hola")).rejects.toThrow(
      "La IA no devolvió una respuesta válida."
    );
  });

  it("lanza un error amigable cuando fetch falla por red", async () => {
    global.fetch.mockRejectedValue(new Error("network down"));

    await expect(sendMessageToCharacter("holmes", [], "Hola")).rejects.toThrow(
      "No se pudo conectar con el servidor"
    );
  });

  it("lanza un error si el mensaje está vacío (validado antes de llamar a fetch)", async () => {
    await expect(sendMessageToCharacter("holmes", [], "   ")).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
