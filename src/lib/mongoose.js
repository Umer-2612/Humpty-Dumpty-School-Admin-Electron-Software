import mongoose from "mongoose";

const {
  MONGODB_URI,
  MONGO_DB_PROTOCOL = "mongodb+srv",
  MONGO_DB_USERNAME,
  MONGO_DB_PASSWORD,
  MONGO_DB_HOST,
  MONGO_DB_NAME,
  MONGO_DB_OPTIONS = "",
} = process.env;

function buildMongoUri() {
  if (!MONGO_DB_HOST) {
    throw new Error("Missing required env variable: MONGO_DB_HOST");
  }

  if (!MONGO_DB_NAME) {
    throw new Error("Missing required env variable: MONGO_DB_NAME");
  }

  const hasUsername = Boolean(MONGO_DB_USERNAME);
  const hasPassword = Boolean(MONGO_DB_PASSWORD);

  if (hasUsername !== hasPassword) {
    throw new Error(
      "Both MONGO_DB_USERNAME and MONGO_DB_PASSWORD must be provided together."
    );
  }

  const credentials =
    hasUsername && hasPassword
      ? `${encodeURIComponent(MONGO_DB_USERNAME)}:${encodeURIComponent(
          MONGO_DB_PASSWORD
        )}@`
      : "";

  const optionsSegment = MONGO_DB_OPTIONS
    ? MONGO_DB_OPTIONS.startsWith("?")
      ? MONGO_DB_OPTIONS
      : `?${MONGO_DB_OPTIONS}`
    : "";

  return `${MONGO_DB_PROTOCOL}://${credentials}${MONGO_DB_HOST}/${MONGO_DB_NAME}${optionsSegment}`;
}

const resolvedMongoUri = MONGODB_URI ?? buildMongoUri();

if (!global._mongooseConnection) {
  global._mongooseConnection = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (global._mongooseConnection.conn) {
    return global._mongooseConnection.conn;
  }

  if (!global._mongooseConnection.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };
    global._mongooseConnection.promise = mongoose
      .connect(resolvedMongoUri, opts)
      .then((mongooseInstance) => mongooseInstance);
  }

  global._mongooseConnection.conn = await global._mongooseConnection.promise;
  return global._mongooseConnection.conn;
}
