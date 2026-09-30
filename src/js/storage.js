// Defensive localStorage wrapper: corrupt JSON, private mode and quota errors never crash the app.

export function loadJSON(key, fallback, isValid = () => true) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`Could not save "${key}"`, err);
    return false;
  }
}

export function loadString(key, fallback, allowed) {
  try {
    const value = localStorage.getItem(key);
    if (value == null) return fallback;
    if (allowed && !allowed.includes(value)) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

export function saveString(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (err) {
    console.warn(`Could not save "${key}"`, err);
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
