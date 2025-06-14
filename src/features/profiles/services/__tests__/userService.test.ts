import { createUserProfile, updateUserProfile, getUserProfile } from "../userService";
import { mockUserModel, resetAllMocks } from "@/lib/test-utils";

// Mock the dependencies
jest.mock("@/models/User");
jest.mock("@/lib/dbConnect");

describe("UserService", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("createUserProfile", () => {
    it("should create a new user profile", async () => {
      const userData = {
        clerkId: "user_123",
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
      };

      const mockCreatedUser = { ...userData, _id: "user_objectid_123" };
      mockUserModel.create.mockResolvedValue(mockCreatedUser);

      const result = await createUserProfile(userData);

      expect(mockUserModel.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockCreatedUser);
    });

    it("should handle creation errors", async () => {
      const userData = {
        clerkId: "user_123",
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
      };

      mockUserModel.create.mockRejectedValue(new Error("Database error"));

      await expect(createUserProfile(userData)).rejects.toThrow("Database error");
    });
  });

  describe("getUserProfile", () => {
    it("should get user profile by clerkId", async () => {
      const mockUser = {
        _id: "user_objectid_123",
        clerkId: "user_123",
        username: "testuser",
        name: "Test User",
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await getUserProfile("user_123");

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ clerkId: "user_123" });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await getUserProfile("nonexistent_user");

      expect(result).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile", async () => {
      const updateData = {
        bio: "Updated bio",
        location: "New York",
      };

      const mockUpdatedUser = {
        _id: "user_objectid_123",
        clerkId: "user_123",
        username: "testuser",
        name: "Test User",
        ...updateData,
      };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const result = await updateUserProfile("user_objectid_123", updateData);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user_objectid_123",
        { $set: updateData },
        { new: true }
      );
      expect(result).toEqual(mockUpdatedUser);
    });
  });
});
