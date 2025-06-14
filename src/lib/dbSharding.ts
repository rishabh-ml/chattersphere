import { ReadPreferenceMode } from "mongodb";

/**
 * MongoDB Sharding and Replication Configuration
 *
 * This file contains utilities for configuring MongoDB sharding and replication
 * for improved scalability and performance.
 *
 * Note: This is a configuration guide that would be implemented in a production
 * environment with a MongoDB Atlas cluster or self-hosted MongoDB deployment.
 * The actual implementation would depend on the specific deployment environment.
 */

/**
 * MongoDB Sharding Configuration
 *
 * Sharding distributes data across multiple machines to handle high throughput
 * and large data volumes.
 *
 * Steps to implement sharding:
 * 1. Set up a sharded cluster with config servers, mongos routers, and shard replicas
 * 2. Enable sharding for the database
 * 3. Choose a shard key for each collection
 * 4. Shard the collections
 */

/**
 * Example MongoDB Atlas Sharding Configuration
 *
 * This would be done through the MongoDB Atlas UI or API:
 *
 * 1. Create a new cluster with sharding enabled
 * 2. Select the number of shards (start with 2-3)
 * 3. Configure the shard key for each collection
 */

/**
 * Recommended Shard Keys for ChatterSphere Collections
 */
export const recommendedShardKeys = {
  posts: {
    key: { community: 1, createdAt: -1 },
    description: "Shard by community and creation date to distribute posts across shards",
  },
  comments: {
    key: { post: 1, createdAt: -1 },
    description: "Shard by post ID and creation date to keep comments for the same post together",
  },
  communities: {
    key: { _id: 1 },
    description: "Shard by community ID for even distribution",
  },
  users: {
    key: { _id: 1 },
    description: "Shard by user ID for even distribution",
  },
  memberships: {
    key: { community: 1, user: 1 },
    description: "Shard by community and user to keep related memberships together",
  },
};

/**
 * MongoDB Replication Configuration
 *
 * Replication provides redundancy and high availability with automatic failover.
 *
 * A replica set consists of:
 * - Primary node: Receives all write operations
 * - Secondary nodes: Maintain copies of the primary's data
 * - Arbiter (optional): Participates in elections but doesn't hold data
 */

/**
 * Example MongoDB Atlas Replication Configuration
 *
 * This would be done through the MongoDB Atlas UI or API:
 *
 * 1. Create a new cluster with replication enabled
 * 2. Select the number of replicas (typically 3 for production)
 * 3. Configure the read preference
 */

/**
 * Read Preference Configuration
 *
 * Determines how MongoDB clients route read operations to members of a replica set.
 */
export const readPreferenceOptions = {
  primary: {
    description: "All operations read from the primary node",
    useCase: "Default. Use when you need the most up-to-date data",
  },
  primaryPreferred: {
    description: "Read from primary if available, otherwise from secondary",
    useCase: "Good balance of consistency and availability",
  },
  secondary: {
    description: "All operations read from secondary nodes",
    useCase: "Use to offload read operations from the primary",
  },
  secondaryPreferred: {
    description: "Read from secondary if available, otherwise from primary",
    useCase: "Best for read-heavy workloads",
  },
  nearest: {
    description: "Read from the member with the lowest network latency",
    useCase: "Best for geographically distributed applications",
  },
};

/**
 * Connection String Configuration for Replica Sets
 *
 * Example: mongodb://server1:27017,server2:27017,server3:27017/chattersphere?replicaSet=rs0
 */

/**
 * Configure MongoDB connection options for replication
 * @param readPreference The read preference to use
 * @returns MongoDB connection options
 */
export function getReplicaSetOptions(readPreference: ReadPreferenceMode = "primaryPreferred") {
  return {
    readPreference,
    replicaSet: process.env.MONGODB_REPLICA_SET || "rs0",
    w: "majority" as const, // Write concern: wait for acknowledgment from a majority of replicas
    wtimeout: 5000, // Wait up to 5 seconds for write acknowledgment
    j: true, // Wait for the write to be journaled before returning
  };
}

/**
 * Configure MongoDB connection options for sharded clusters
 * @returns MongoDB connection options
 */
export function getShardedClusterOptions() {
  return {
    readPreference: "secondaryPreferred" as ReadPreferenceMode,
    retryWrites: true,
    w: "majority" as const,
    wtimeout: 5000,
    j: true,
  };
}

/**
 * Implementation Notes
 *
 * 1. For a production deployment, you would:
 *    - Set up a MongoDB Atlas cluster with sharding and replication
 *    - OR set up a self-hosted MongoDB deployment with sharding and replication
 *
 * 2. Update the connection string in .env.local:
 *    MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/chattersphere?retryWrites=true&w=majority
 *
 * 3. Update the dbConnect.ts file to use the appropriate connection options
 *
 * 4. Create indexes to support the shard keys
 *
 * 5. Monitor the cluster performance and adjust as needed
 */
