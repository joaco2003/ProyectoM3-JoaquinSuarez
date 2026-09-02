// app.js
// Router SPA (History API) + renderizado de vistas + orquestación del chat.

import { CHARACTERS, getCharacterById } from "./characters.js";
import { createMessage, formatTimestamp, parseRoute } from "./utils.js";
import { sendMessageToCharacter } from "./chat.js";
import { saveHistory, loadHistory, clearHistory, hasSavedHistory } from "./storage.js";

const APP_STATE_KEY = "comicsanscon:selectedCharacter";
const THEME_KEY = "comicsanscon:theme";

const app = document.getElementById("app");

const state = {
  route: parseRoute(window.location.pathname),
  selectedCharacterId: safeGet(APP_STATE_KEY) || CHARACTERS[0].id,
  history: [], // se carga por personaje al entrar al chat
  isTyping: false,
  error: null,
};

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* noop */
  }
}

// ---------- Routing ----------

function navigate(path, { replace = false } = {}) {
  if (replace) {
    window.history.replaceState({}, "", path);
  } else {
    window.history.pushState({}, "", path);
  }
  state.route = parseRoute(path);
  render();
}

window.addEventListener("popstate", () => {
  state.route = parseRoute(window.location.pathname);
  render();
});

// Delegación de clicks para links internos [data-link]
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (!link) return;
  e.preventDefault();
  navigate(link.getAttribute("href"));
});

// ---------- Theme ----------

function initTheme() {
  const saved = safeGet(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  safeSet(THEME_KEY, next);
}

// ---------- Render root ----------

function render() {
  window.scrollTo(0, 0);
  if (state.route === "home") return renderHome();
  if (state.route === "chat") return renderChat();
  if (state.route === "about") return renderAbout();
  renderHome();
}

function layout(activeRoute, contentHtml) {
  return `
    <header class="topbar">
      <a class="brand" href="/home" data-link>
        <span class="brand-mark">CSC</span>
        <span class="brand-name">ComicSansCon</span>
      </a>
      <nav class="toplinks" aria-label="Navegación principal (tablet/desktop)">
        <a href="/home" data-link class="toplink ${activeRoute === "home" ? "is-active" : ""}">Home</a>
        <a href="/chat" data-link class="toplink ${activeRoute === "chat" ? "is-active" : ""}">Chat</a>
        <a href="/about" data-link class="toplink ${activeRoute === "about" ? "is-active" : ""}">About</a>
      </nav>
      <button class="theme-toggle" id="theme-toggle" aria-label="Cambiar tema" title="Cambiar tema claro/oscuro">
        <span class="theme-icon-dark">🌙</span>
        <span class="theme-icon-light">☀️</span>
      </button>
    </header>
    <main class="view">${contentHtml}</main>
    <nav class="bottombar" aria-label="Navegación principal">
      <a href="/home" data-link class="navlink ${activeRoute === "home" ? "is-active" : ""}">
        <span class="navicon">🏠</span><span>Home</span>
      </a>
      <a href="/chat" data-link class="navlink ${activeRoute === "chat" ? "is-active" : ""}">
        <span class="navicon">💬</span><span>Chat</span>
      </a>
      <a href="/about" data-link class="navlink ${activeRoute === "about" ? "is-active" : ""}">
        <span class="navicon">ℹ️</span><span>About</span>
      </a>
    </nav>
  `;
}

function bindGlobalUI() {
  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
}

// ---------- Home ----------

function renderHome() {
  const character = getCharacterById(state.selectedCharacterId);

  const cards = CHARACTERS.map(
    (c) => `
    <button class="char-card ${c.id === state.selectedCharacterId ? "is-selected" : ""}"
            data-select-character="${c.id}" style="--char-accent:${c.color}">
      <span class="char-card-avatar">${c.avatar}</span>
      <span class="char-card-name">${c.name}</span>
      <span class="char-card-franchise">${c.franchise}</span>
      <span class="char-card-tagline">${c.tagline}</span>
    </button>`
  ).join("");

  app.innerHTML = layout(
    "home",
    `
    <section class="hero">
      <p class="eyebrow-free-headline">Elige a tu personaje y empieza la conversación</p>
      <h1>Chatea con <span style="color:${character.color}">${character.name}</span></h1>
      <p class="hero-sub">${character.description}</p>
      <a href="/chat" data-link class="btn btn-primary">Empezar a chatear</a>
    </section>

    <section class="gallery">
      <h2>Galería de personajes</h2>
      <div class="char-grid">${cards}</div>
    </section>
  `
  );

  bindGlobalUI();
  document.querySelectorAll("[data-select-character]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedCharacterId = btn.getAttribute("data-select-character");
      safeSet(APP_STATE_KEY, state.selectedCharacterId);
      renderHome();
    });
  });
}

// ---------- Chat ----------

function renderChat() {
  const character = getCharacterById(state.selectedCharacterId);
  state.history = loadHistory(character.id);
  const showSavedBadge = hasSavedHistory(character.id) && state.history.length > 0;

  app.innerHTML = layout(
    "chat",
    `
    <section class="chat-screen" style="--char-accent:${character.color}">
      <div class="chat-header">
        <div class="chat-header-info">
          <span class="chat-avatar">${character.avatar}</span>
          <div>
            <h1>${character.name}</h1>
            <p class="chat-sub">${character.franchise} ${showSavedBadge ? '· <span class="badge-saved">historial guardado</span>' : ""}</p>
          </div>
        </div>
        <button class="btn btn-ghost btn-small" id="clear-history">Borrar historial</button>
      </div>

      <div class="messages" id="messages" aria-live="polite"></div>

      <div class="error-banner" id="error-banner" hidden></div>

      <form class="composer" id="composer">
        <textarea
          id="message-input"
          class="composer-input"
          placeholder="Escríbele a ${character.name}…"
          rows="1"
          maxlength="500"
        ></textarea>
        <button type="submit" class="btn btn-primary composer-send" id="send-btn">Enviar</button>
      </form>
    </section>
  `
  );

  bindGlobalUI();
  renderMessages();
  bindChatEvents(character);
  scrollMessagesToBottom();
}

function renderMessages() {
  const list = document.getElementById("messages");
  if (!list) return;

  if (state.history.length === 0) {
    list.innerHTML = `<p class="empty-state">Todavía no hay mensajes. ¡Salúdalo!</p>`;
  } else {
    list.innerHTML = state.history
      .map((m) => messageBubble(m))
      .join("");
  }

  if (state.isTyping) {
    list.insertAdjacentHTML(
      "beforeend",
      `<div class="msg msg-character msg-typing" id="typing-indicator">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>`
    );
  }

  // Botones de copiar en mensajes del personaje
  list.querySelectorAll("[data-copy-text]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = decodeURIComponent(btn.getAttribute("data-copy-text"));
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "✓ Copiado";
        setTimeout(() => (btn.textContent = "Copiar"), 1500);
      } catch {
        /* clipboard no disponible: fallar en silencio */
      }
    });
  });
}

function messageBubble(m) {
  const isUser = m.role === "user";
  const time = formatTimestamp(m.timestamp);
  const copyBtn = !isUser
    ? `<button class="copy-btn" data-copy-text="${encodeURIComponent(m.text)}">Copiar</button>`
    : "";
  return `
    <div class="msg ${isUser ? "msg-user" : "msg-character"}">
      <p class="msg-text">${escapeHtml(m.text)}</p>
      <div class="msg-meta">
        <span class="msg-time">${time}</span>
        ${copyBtn}
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function scrollMessagesToBottom() {
  const list = document.getElementById("messages");
  if (list) list.scrollTop = list.scrollHeight;
}

function bindChatEvents(character) {
  const form = document.getElementById("composer");
  const input = document.getElementById("message-input");
  const clearBtn = document.getElementById("clear-history");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSend(character, input);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(character, input);
    }
  });

  clearBtn.addEventListener("click", () => {
    clearHistory(character.id);
    state.history = [];
    renderMessages();
  });
}

async function handleSend(character, input) {
  const text = input.value.trim();
  if (!text || state.isTyping) return;

  hideError();

  const userMsg = createMessage("user", text);
  state.history.push(userMsg);
  saveHistory(character.id, state.history);
  input.value = "";
  renderMessages();
  scrollMessagesToBottom();

  state.isTyping = true;
  renderMessages();
  scrollMessagesToBottom();

  try {
    const reply = await sendMessageToCharacter(character.id, state.history, text);
    const charMsg = createMessage("character", reply);
    state.history.push(charMsg);
    saveHistory(character.id, state.history);
  } catch (err) {
    showError(err.message || "Ocurrió un error inesperado.");
  } finally {
    state.isTyping = false;
    renderMessages();
    scrollMessagesToBottom();
  }
}

function showError(message) {
  state.error = message;
  const banner = document.getElementById("error-banner");
  if (banner) {
    banner.textContent = `⚠️ ${message}`;
    banner.hidden = false;
  }
}

function hideError() {
  state.error = null;
  const banner = document.getElementById("error-banner");
  if (banner) banner.hidden = true;
}

// ---------- About ----------

function renderAbout() {
  const character = getCharacterById(state.selectedCharacterId);

  app.innerHTML = layout(
    "about",
    `
    <section class="about">
      <h1>Sobre este proyecto</h1>
      <p>
        Esta es una prueba de concepto desarrollada en <strong>ComicSansCon</strong>, una agencia
        de experiencias interactivas para fans de videojuegos, películas y series. La app permite
        chatear con personajes ficticios usando Google Gemini como modelo de lenguaje.
      </p>

      <h2>Stack técnico</h2>
      <ul>
        <li>HTML, CSS y JavaScript vanilla (sin framework de UI)</li>
        <li>Routing propio con la History API (sin recargas de página)</li>
        <li>Vercel Serverless Functions como proxy seguro hacia la API de Gemini</li>
        <li>Persistencia de conversación en <code>localStorage</code></li>
        <li>Tests unitarios con Vitest</li>
      </ul>

      <h2>Personaje actual: ${character.name}</h2>
      <p>${character.description}</p>
      <p><em>Franquicia:</em> ${character.franchise} · <em>Lugar de origen:</em> ${character.home}</p>

      <h2>Uso de IA en el desarrollo</h2>
      <p>
        Se utilizó IA como asistente de programación para bocetar la estructura del router SPA,
        redactar los system prompts de cada personaje y revisar la accesibilidad del CSS responsive.
        Todo el código fue revisado y ajustado manualmente antes de su despliegue.
      </p>
    </section>
  `
  );

  bindGlobalUI();
}

// ---------- Init ----------

function init() {
  initTheme();
  // Si la URL inicial no es una de las conocidas, normalizamos con replaceState.
  navigate(window.location.pathname === "/" ? "/home" : window.location.pathname, { replace: true });
}

init();
