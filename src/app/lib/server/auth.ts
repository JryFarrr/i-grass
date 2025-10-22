import crypto from "crypto";
import { createServerSupabase } from "../supabase/server";

export const SESSION_COOKIE_NAME = "igras_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const TOKEN_SEPARATOR = ".";

export type UserRole = "admin" | "user";
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
  role: UserRole;
};

function getSecret() {
  return process.env.AUTH_SECRET || "igras-dev-secret";
}

function sanitizeUser(user: StoredUser): PublicUser {
  const { id, name, email, created_at, role } = user;
  return { id, name, email, created_at, role };
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

// database 
async function findUserByEmail(email: string){
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

    if(error){
      console.log('Error fetching user by email:', error);
      throw new Error("Internal server error"); 
    }
    if(!data) return undefined;
    return data as StoredUser;
}

async function findUserById(id: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', id)
  .maybeSingle();

  if(error){
    console.log('Error find user by id :', error);
    throw new Error("Internal server error"); 
  }
  if(!data) return undefined;
  return data as PublicUser;
}


export async function createUser(name: string, email: string, password: string, role: UserRole = "user"): Promise<PublicUser> {
  if (!name.trim()) throw new Error("Nama wajib diisi");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Format email tidak valid");
  if (password.length < 6) throw new Error("Password minimal 6 karakter");

  const normalized = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalized);
  if (existing) throw new Error('Email sudah terdaftar');

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  const supabase =  await createServerSupabase();
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalized,
      password_hash: passwordHash,
      salt,
      created_at: new Date().toISOString(),
      role,
    })
    .select("id, name, email, created_at, role")
    .single();

  if (error) {
    console.log('Error creating user:', error);
    throw new Error("Internal server error"); 
  }

  if (!data) {
    throw new Error("Gagal membuat user");
  }

  return sanitizeUser(data as StoredUser);
}

// auth
type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  exp: number;
};

export async function authenticateUser(email: string, password: string): Promise<PublicUser> {
  const normalized = email.trim().toLowerCase();
  const user = await findUserByEmail(normalized);
  if (!user) throw new Error("Email atau kata sandi salah");
  const ok = verifyPassword(password, user.salt, user.password_hash);
  if (!ok) throw new Error("Email atau kata sandi salah");
  return sanitizeUser(user as StoredUser);
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
  return sanitizeUser(user as StoredUser);
}

// cookies
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
  const exist = await findUserByEmail("demo@igras.app");
  if (exist) return; 
  try {
    await createUser("Pengguna Demo", "demo@igras.app", "igras123", "admin");
    return;
  } catch (error) {
    console.error("Error creating demo user:", error);
  }
}


