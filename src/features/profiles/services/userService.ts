import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";

export interface CreateUserData {
  clerkId: string;
  username: string;
  name: string;
  email: string;
  image?: string;
}

export interface UpdateUserData {
  bio?: string;
  location?: string;
  website?: string;
  pronouns?: string;
  interests?: string[];
  socialLinks?: Array<{ platform: string; url: string }>;
}

/**
 * Create a new user profile
 */
export async function createUserProfile(userData: CreateUserData) {
  await connectToDatabase();
  return await User.create(userData);
}

/**
 * Get user profile by Clerk ID
 */
export async function getUserProfile(clerkId: string) {
  await connectToDatabase();
  return await User.findOne({ clerkId }).lean();
}

/**
 * Get user profile by MongoDB ID
 */
export async function getUserProfileById(userId: string) {
  await connectToDatabase();
  return await User.findById(userId).lean();
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updateData: UpdateUserData) {
  await connectToDatabase();
  return await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  ).lean();
}

/**
 * Search users by username or name
 */
export async function searchUsers(query: string, limit: number = 10) {
  await connectToDatabase();
  
  const searchRegex = new RegExp(query, "i");
  
  return await User.find({
    $or: [
      { username: { $regex: searchRegex } },
      { name: { $regex: searchRegex } },
    ],
  })
    .select("username name image")
    .limit(limit)
    .lean();
}

/**
 * Get user's followers
 */
export async function getUserFollowers(userId: string, page: number = 1, limit: number = 20) {
  await connectToDatabase();
  
  const skip = (page - 1) * limit;
  
  const user = await User.findById(userId)
    .populate({
      path: "followers",
      select: "username name image",
      options: { skip, limit },
    })
    .lean();
    
  return user?.followers || [];
}

/**
 * Get users that a user is following
 */
export async function getUserFollowing(userId: string, page: number = 1, limit: number = 20) {
  await connectToDatabase();
  
  const skip = (page - 1) * limit;
  
  const user = await User.findById(userId)
    .populate({
      path: "following",
      select: "username name image",
      options: { skip, limit },
    })
    .lean();
    
  return user?.following || [];
}

/**
 * Follow a user
 */
export async function followUser(followerId: string, followeeId: string) {
  await connectToDatabase();
  
  // Add followee to follower's following list
  await User.findByIdAndUpdate(followerId, {
    $addToSet: { following: followeeId },
  });
  
  // Add follower to followee's followers list
  await User.findByIdAndUpdate(followeeId, {
    $addToSet: { followers: followerId },
  });
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followeeId: string) {
  await connectToDatabase();
  
  // Remove followee from follower's following list
  await User.findByIdAndUpdate(followerId, {
    $pull: { following: followeeId },
  });
  
  // Remove follower from followee's followers list
  await User.findByIdAndUpdate(followeeId, {
    $pull: { followers: followerId },
  });
}
