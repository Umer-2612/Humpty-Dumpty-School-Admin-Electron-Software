import mongoose from "mongoose";

const {
  MONGODB_URI = "mongodb+srv://karachiwalaumer2612_db_user:Ob36phl9r9gCzHX2@cluster0.eu1mlvh.mongodb.net/school2",
} = process.env;

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
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => mongooseInstance);
  }

  global._mongooseConnection.conn = await global._mongooseConnection.promise;
  return global._mongooseConnection.conn;
}
