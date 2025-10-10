export type UserRole = "admin" | "user";

export type Session = { name: string; email: string; role: UserRole } | null;

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};
