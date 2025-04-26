// src/lib/dbConnect.ts
import mongoose from "mongoose";

declare global {
    // Global cache for mongoose connection
    // eslint-disable-next-line no-var
    var mongooseConnection: {
        isConnected?: boolean;
        promise?: Promise<typeof mongoose>;
    };
}

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
    );
}

async function dbConnect(): Promise<typeof mongoose> {
    if (global.mongooseConnection?.isConnected) {
        return mongoose;
    }

    if (!global.mongooseConnection?.promise) {
        global.mongooseConnection = {
            promise: mongoose
                .connect(MONGODB_URI, { dbName: "chattersphere" })
                .then((mongooseInstance) => {
                    global.mongooseConnection.isConnected = true;
                    return mongooseInstance;
                }),
        };
    }

    await global.mongooseConnection.promise;
    return mongoose;
}

export default dbConnect;
