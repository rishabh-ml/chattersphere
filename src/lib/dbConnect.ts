// src/lib/dbConnect.ts
import mongoose from "mongoose";

declare global {
    // Global cache for mongoose connection
    // eslint-disable-next-line no-var
    var mongooseConnection: {
        promise?: Promise<typeof mongoose>;
    };
}

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
    );
}

/**
 * Connects to MongoDB if not already connected
 * Uses mongoose.connection.readyState to check connection status
 * Returns mongoose instance
 */
async function dbConnect(): Promise<typeof mongoose> {
    // Check if we're already connected (1 = connected)
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }

    // If we have a connection in progress, wait for it
    if (!global.mongooseConnection?.promise) {
        global.mongooseConnection = {
            promise: mongoose
                .connect(MONGODB_URI, { dbName: "chattersphere" })
                .then((mongooseInstance) => {
                    return mongooseInstance;
                }),
        };
    }

    await global.mongooseConnection.promise;
    return mongoose;
}

export default dbConnect;
