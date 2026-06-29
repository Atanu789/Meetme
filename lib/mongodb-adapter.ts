import "server-only";

import { MongoClient } from "mongodb";
import {
  configureMongoDns,
  mongoDnsLookup,
  resolveMongoConnectionString,
} from "./mongodb-dns";

configureMongoDns();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

const clientOptions = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  lookup: mongoDnsLookup,
};

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = resolveMongoConnectionString(uri).then((resolvedUri) => {
      const client = new MongoClient(resolvedUri, clientOptions);

      return client.connect();
    }).catch((error) => {
      global._mongoClientPromise = undefined;
      throw error;
    });
  }

  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = resolveMongoConnectionString(uri).then((resolvedUri) => {
    const client = new MongoClient(resolvedUri, clientOptions);

    return client.connect();
  });
}

export default clientPromise;
