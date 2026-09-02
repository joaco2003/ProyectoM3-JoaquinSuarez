// storage.js
// Persistencia del historial de chat en localStorage (extra credit).
// Todas las funciones son defensivas: si localStorage no está disponible
// (SSR, modo privado, etc.) fallan en silencio en vez de romper la app.

const STORAGE_PREFIX = "comicsanscon:chat:";

function keyFor(characterId) {
  return `${STORAGE_PREFIX}${characterId}`;
}

export function saveHistory(characterId, history) {
  try {
    localStorage.setItem(keyFor(characterId), JSON.stringify(history));
    return true;
  } catch {
    return false;
  }
}

export function loadHistory(characterId) {
  try {
    const raw = localStorage.getItem(keyFor(characterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearHistory(characterId) {
  try {
    localStorage.removeItem(keyFor(characterId));
    return true;
  } catch {
    return false;
  }
}

export function hasSavedHistory(characterId) {
  try {
    return localStorage.getItem(keyFor(characterId)) !== null;
  } catch {
    return false;
  }
}
