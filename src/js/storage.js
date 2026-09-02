// storage.js


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
