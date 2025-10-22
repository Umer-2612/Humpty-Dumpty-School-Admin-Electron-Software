import bcrypt from "bcryptjs";
import { User } from "@/models";

const DEFAULT_ADMIN_USERNAME =
  process.env.DEFAULT_ADMIN_USERNAME?.trim() || "admin";
const DEFAULT_ADMIN_PASSWORD =
  process.env.DEFAULT_ADMIN_PASSWORD?.trim() || "admin@123";
const BCRYPT_SALT_ROUNDS = 10;

function normaliseUsername(username) {
  return username.trim().toLowerCase();
}

export async function findUserByUsername(username) {
  if (!username) return null;
  return User.findOne({ username: normaliseUsername(username) });
}

export async function createUser(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const normalisedUsername = normaliseUsername(username);

  const existing = await User.findOne({ username: normalisedUsername });
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = new User({ username: normalisedUsername, passwordHash });
  return user.save();
}

export async function ensureDefaultAdminUser() {
  const normalisedUsername = normaliseUsername(DEFAULT_ADMIN_USERNAME);
  const existing = await User.findOne({ username: normalisedUsername });
  if (existing) return existing;
  return createUser(DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD);
}

export async function verifyUserCredentials(username, password) {
  const user = await findUserByUsername(username);
  if (!user) return null;

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return null;

  return user;
}
