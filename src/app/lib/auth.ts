// Simple client-side auth helpers using localStorage + cookies
// Not for production; just to demo flows without a backend.

export type User = {
  name: string;
  email: string;
  password: string; // plain for demo only
};

const USERS_KEY = "igras.users";
const SESSION_KEY = "igras.session";

function readUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const arr = raw ? (JSON.parse(raw) as User[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeUsers(list: User[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch {}
}

export function seedDefaultUser() {
  // Seed a default account if none exists to ease testing
  if (typeof window === "undefined") return;
  const existing = readUsers();
  if (!existing.find(u => u.email === "demo@igras.app")) {
    existing.push({ name: "Pengguna Demo", email: "demo@igras.app", password: "igras123" });
    writeUsers(existing);
  }
}

export function signup(name: string, email: string, password: string) {
  const users = readUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email sudah terdaftar");
  }
  users.push({ name, email, password });
  writeUsers(users);
  setSession({ name, email });
}

export function login(email: string, password: string) {
  const users = readUsers();
  const found = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!found) throw new Error("Email atau kata sandi salah");
  setSession({ name: found.name, email: found.email });
}

export type Session = { name: string; email: string } | null;

export function getSession(): Session {
  if (typeof document === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(sess: Exclude<Session, null>) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    // Also set a lax cookie so SSR middleware could read if needed
    const attrs = `; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax` + (location.protocol === 'https:' ? '; Secure' : '');
    document.cookie = `sessionEmail=${encodeURIComponent(sess.email)}${attrs}`;
  } catch {}
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `sessionEmail=; path=/; max-age=0`;
  } catch {}
}

// Fake Google login (demo only)
export function loginWithGoogle() {
  const user = { name: "Google User", email: "user@gmail.com" };
  setSession(user);
}
