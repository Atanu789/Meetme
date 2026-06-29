import "server-only";

import mongoose from "mongoose";
import {
  configureMongoDns,
  mongoDnsLookup,
  resolveMongoConnectionString,
} from "./mongodb-dns";

configureMongoDns();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: Cached | undefined;
}

const cached: Cached = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = resolveMongoConnectionString(MONGODB_URI).then((resolvedUri) =>
      mongoose.connect(resolvedUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 15000,
        lookup: mongoDnsLookup,
      })
    );
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;

    console.error("MongoDB connection error:", error);

    throw error;
  }
}

export default dbConnect;
