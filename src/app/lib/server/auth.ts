import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { PublicUser } from "../auth-types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export const SESSION_COOKIE_NAME = "igras_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  exp: number;
};

const TOKEN_SEPARATOR = ".";

function getSecret() {
  return process.env.AUTH_SECRET || "igras-dev-secret";
}

async function ensureUsersFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      await fs.writeFile(USERS_FILE, "[]", "utf8");
    } else {
      throw err;
    }
  }
}

async function loadUsers(): Promise<StoredUser[]> {
  await ensureUsersFile();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is StoredUser =>
        typeof item === "object" &&
        item !== null &&
        "email" in item &&
        "passwordHash" in (item as Record<string, unknown>)
    );
  } catch {
    return [];
  }
}

async function saveUsers(users: StoredUser[]) {
  await ensureUsersFile();
  const payload = JSON.stringify(users, null, 2);
  await fs.writeFile(USERS_FILE, payload, "utf8");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizeUser(user: StoredUser): PublicUser {
  const { id, name, email, createdAt } = user;
  return { id, name, email, createdAt };
}

function hashPassword(password: string, salt: string) {
  const hashed = crypto.scryptSync(password, salt, 64);
  return hashed.toString("hex");
}

function verifyPassword(password: string, salt: string, hash: string) {
  const hashed = hashPassword(password, salt);
  const hashBuffer = Buffer.from(hash, "hex");
  const hashedBuffer = Buffer.from(hashed, "hex");
  if (hashBuffer.length !== hashedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(hashBuffer, hashedBuffer);
}

export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  const users = await loadUsers();
  const target = normalizeEmail(email);
  return users.find((user) => normalizeEmail(user.email) === target);
}

export async function findUserById(id: string): Promise<StoredUser | undefined> {
  const users = await loadUsers();
  return users.find((user) => user.id === id);
}

export async function createUser(name: string, email: string, password: string): Promise<PublicUser> {
  if (!name.trim()) throw new Error("Nama wajib diisi");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Format email tidak valid");
  if (password.length < 6) throw new Error("Password minimal 6 karakter");

  const normalized = normalizeEmail(email);
  const users = await loadUsers();
  if (users.some((user) => normalizeEmail(user.email) === normalized)) {
    throw new Error("Email sudah terdaftar");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);
  return sanitizeUser(user);
}

export async function authenticateUser(email: string, password: string): Promise<PublicUser> {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Email atau kata sandi salah");
  const ok = verifyPassword(password, user.salt, user.passwordHash);
  if (!ok) throw new Error("Email atau kata sandi salah");
  return sanitizeUser(user);
}

function serializePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function deserializePayload(payload: string): SessionPayload | null {
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const data = JSON.parse(json) as unknown;
    if (typeof data !== "object" || data === null) return null;
    const candidate = data as Partial<SessionPayload>;
    if (!candidate.sub || !candidate.exp || !candidate.email || !candidate.name) return null;
    return candidate as SessionPayload;
  } catch {
    return null;
  }
}

function signPayload(payloadEncoded: string) {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update(payloadEncoded).digest("base64url");
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function createSessionToken(user: PublicUser) {
  const payload: SessionPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = serializePayload(payload);
  const signature = signPayload(encoded);
  const token = `${encoded}${TOKEN_SEPARATOR}${signature}`;
  return { token, expiresAt: payload.exp };
}

export async function parseSessionToken(token: string | undefined | null): Promise<PublicUser | null> {
  if (!token) return null;
  const [payloadEncoded, signature] = token.split(TOKEN_SEPARATOR);
  if (!payloadEncoded || !signature) return null;
  const expected = signPayload(payloadEncoded);
  if (!safeCompare(expected, signature)) return null;
  const payload = deserializePayload(payloadEncoded);
  if (!payload) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  const user = await findUserById(payload.sub);
  if (!user) return null;
  return sanitizeUser(user);
}

export function buildSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function buildClearSessionCookie() {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export async function ensureDemoUser() {
  const existing = await findUserByEmail("demo@igras.app");
  if (!existing) {
    await createUser("Pengguna Demo", "demo@igras.app", "igras123");
  }
}

export async function listUsers(): Promise<PublicUser[]> {
  const users = await loadUsers();
  return users.map(sanitizeUser);
}

