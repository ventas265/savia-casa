const KEY = "savia.device";
const TOKEN = "savia.token";

export function deviceId() {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function setDeviceId(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

export function deviceToken() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(TOKEN) || "";
  } catch {
    return "";
  }
}

export function setDeviceToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN, token);
  } catch {
    /* ignore */
  }
}

export function claimRecovery(code: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("savia.recovery", code);
  } catch {
    /* ignore */
  }
}

export function takeRecovery() {
  if (typeof window === "undefined") return "";
  try {
    const c = sessionStorage.getItem("savia.recovery") || "";
    sessionStorage.removeItem("savia.recovery");
    return c;
  } catch {
    return "";
  }
}
