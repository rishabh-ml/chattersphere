import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error(
        "❌ Please define the MONGODB_URI environment variable inside .env.local"
    );
}

console.log('MongoDB URI is defined');

interface MongooseCache {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
}

// Extend global type for cached mongoose connection
declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
global.mongooseCache = cached;

async function dbConnect(): Promise<mongoose.Mongoose> {
    if (cached.conn) {
        console.log('Using existing database connection');
        return cached.conn;
    }

    if (!cached.promise) {
        console.log('Creating new database connection');
        cached.promise = mongoose.connect(MONGODB_URI, {
            dbName: "chattersphere", // ✅ Locks to correct database
            bufferCommands: false,
        }).then(mongoose => {
            console.log('Database connected successfully');
            return mongoose;
        }).catch(error => {
            console.error('Error connecting to database:', error);
            throw error;
        });
    } else {
        console.log('Using existing database connection promise');
    }

    try {
        cached.conn = await cached.promise;
        console.log('Database connection established');
        return cached.conn;
    } catch (e) {
        cached.promise = null;
        console.error('Failed to establish database connection:', e);
        throw e;
    }
}

export default dbConnect;