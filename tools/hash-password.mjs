#!/usr/bin/env node
// Helper: buat password_hash + salt sesuai skema auth i-Grass.
// Pakai: node tools/hash-password.mjs "password-baru"
import crypto from "crypto";

const password = process.argv[2];
if (!password) {
  console.error("Pemakaian: node tools/hash-password.mjs \"password-baru\"");
  process.exit(1);
}
if (password.length < 6) {
  console.error("Password minimal 6 karakter (aturan aplikasi)");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");

console.log("\nPaste dua kolom ini di Supabase → Table Editor → public.users:\n");
console.log(`salt          : ${salt}`);
console.log(`password_hash : ${hash}\n`);
