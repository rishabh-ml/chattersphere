// src/lib/dbConnect.ts
import mongoose from "mongoose";
import { setupChangeStreams } from "./changeStreams";
import { getReplicaSetOptions, getShardedClusterOptions } from "./dbSharding";

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
        // Determine if we're using a sharded cluster or replica set
        const isShardedCluster = process.env.MONGODB_SHARDED === 'true';
        const isReplicaSet = process.env.MONGODB_REPLICA_SET !== undefined;

        // Build connection options based on deployment type
        const connectionOptions = {
            dbName: "chattersphere",
            // Add connection options for better performance
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 5,  // Maintain at least 5 socket connections
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            // Add deployment-specific options
            ...(isShardedCluster ? getShardedClusterOptions() : {}),
            ...(isReplicaSet && !isShardedCluster ? getReplicaSetOptions() : {}),
        };
        
        console.log(`Connecting to MongoDB with ${isShardedCluster ? 'sharded cluster' : isReplicaSet ? 'replica set' : 'standalone'} configuration`);
        
        global.mongooseConnection = {
            promise: mongoose
                .connect(MONGODB_URI, connectionOptions)
                .then((mongooseInstance) => {
                    if (global.mongooseConnection) {
                        global.mongooseConnection.isConnected = true;
                    }
                    console.log('MongoDB connected successfully');

                    // Log connection details in development
                    if (process.env.NODE_ENV === 'development') {
                        console.log('MongoDB connection options:', connectionOptions);
                    }

                    // Set up change streams for real-time updates
                    try {
                        setupChangeStreams();
                    } catch (error) {
                        console.error('Failed to set up change streams:', error);
                    }

                    return mongooseInstance;
                }),
        };
    }

    await global.mongooseConnection.promise;
    return mongoose;
}

export default dbConnect;
