import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "../route";
import { connectToDatabase } from "@/lib/mongodb";
import Community from "@/models/Community";
import User from "@/models/User";

// Mock the dependencies
jest.mock("@/lib/mongodb");
jest.mock("@/models/Community");
jest.mock("@/models/User");
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

const { auth } = require("@clerk/nextjs/server");

describe("/api/communities API", () => {
  const mockUserId = "user_123";
  const mockCommunityId = "community_123";

  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue({});
    (auth as jest.Mock).mockReturnValue({ userId: mockUserId });
  });

  describe("GET /api/communities", () => {
    it("should fetch communities with pagination", async () => {
      const mockCommunities = [
        {
          _id: "community1",
          name: "Test Community 1",
          slug: "test-community-1",
          description: "A test community",
          isPrivate: false,
          memberCount: 150,
          postCount: 45,
          creator: { _id: "user1", username: "creator1" },
          createdAt: new Date(),
        },
        {
          _id: "community2",
          name: "Test Community 2",
          slug: "test-community-2",
          description: "Another test community",
          isPrivate: true,
          memberCount: 75,
          postCount: 20,
          creator: { _id: "user2", username: "creator2" },
          createdAt: new Date(),
        },
      ];

      (Community.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockCommunities),
            }),
          }),
        }),
      });

      (Community.countDocuments as jest.Mock).mockResolvedValue(2);

      const request = new NextRequest("http://localhost/api/communities?page=1&limit=10");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.communities).toHaveLength(2);
      expect(data.communities[0].name).toBe("Test Community 1");
      expect(data.pagination.total).toBe(2);
      expect(data.pagination.hasMore).toBe(false);
    });

    it("should filter communities by search query", async () => {
      const mockCommunities = [
        {
          _id: "community1",
          name: "React Developers",
          slug: "react-developers",
          description: "A community for React developers",
          isPrivate: false,
          memberCount: 200,
          postCount: 50,
          creator: { _id: "user1", username: "creator1" },
          createdAt: new Date(),
        },
      ];

      (Community.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockCommunities),
            }),
          }),
        }),
      });

      (Community.countDocuments as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest("http://localhost/api/communities?search=React");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.communities).toHaveLength(1);
      expect(data.communities[0].name).toBe("React Developers");
      expect(Community.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "React", $options: "i" } },
          { description: { $regex: "React", $options: "i" } },
        ],
      });
    });

    it("should handle empty results", async () => {
      (Community.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      (Community.countDocuments as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest("http://localhost/api/communities");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.communities).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe("POST /api/communities", () => {
    it("should create a new community", async () => {
      const mockCommunity = {
        _id: mockCommunityId,
        name: "New Test Community",
        slug: "new-test-community",
        description: "A new test community",
        isPrivate: false,
        creator: mockUserId,
        members: [mockUserId],
        moderators: [mockUserId],
        memberCount: 1,
        postCount: 0,
        channelCount: 1,
        save: jest.fn().mockResolvedValue(true),
      };

      (Community.prototype.save as jest.Mock).mockResolvedValue(mockCommunity);
      (Community.findOne as jest.Mock).mockResolvedValue(null); // No existing community with same name

      const requestBody = {
        name: "New Test Community",
        description: "A new test community",
        isPrivate: false,
      };

      const request = new NextRequest("http://localhost/api/communities", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.community.name).toBe("New Test Community");
      expect(data.community.slug).toBe("new-test-community");
      expect(Community.prototype.save).toHaveBeenCalled();
    });

    it("should return 400 if name is missing", async () => {
      const requestBody = {
        description: "A test community",
        isPrivate: false,
      };

      const request = new NextRequest("http://localhost/api/communities", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Name and description are required");
    });

    it("should return 409 if community name already exists", async () => {
      (Community.findOne as jest.Mock).mockResolvedValue({
        _id: "existing_community",
        name: "Existing Community",
      });

      const requestBody = {
        name: "Existing Community",
        description: "A test community",
        isPrivate: false,
      };

      const request = new NextRequest("http://localhost/api/communities", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("A community with this name already exists");
    });

    it("should return 401 if user is not authenticated", async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const requestBody = {
        name: "New Test Community",
        description: "A new test community",
        isPrivate: false,
      };

      const request = new NextRequest("http://localhost/api/communities", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("PUT /api/communities", () => {
    it("should update a community", async () => {
      const mockCommunity = {
        _id: mockCommunityId,
        name: "Test Community",
        description: "Updated description",
        isPrivate: false,
        creator: { _id: mockUserId },
        moderators: [{ _id: mockUserId }],
        save: jest.fn().mockResolvedValue(true),
      };

      (Community.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCommunity),
      });

      const requestBody = {
        communityId: mockCommunityId,
        description: "Updated description",
      };

      const request = new NextRequest("http://localhost/api/communities", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.community.description).toBe("Updated description");
      expect(mockCommunity.save).toHaveBeenCalled();
    });

    it("should return 404 if community not found", async () => {
      (Community.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const requestBody = {
        communityId: "nonexistent",
        description: "Updated description",
      };

      const request = new NextRequest("http://localhost/api/communities", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Community not found");
    });

    it("should return 403 if user is not authorized to update", async () => {
      const mockCommunity = {
        _id: mockCommunityId,
        creator: { _id: "different_user" },
        moderators: [],
      };

      (Community.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCommunity),
      });

      const requestBody = {
        communityId: mockCommunityId,
        description: "Updated description",
      };

      const request = new NextRequest("http://localhost/api/communities", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("You don't have permission to update this community");
    });
  });

  describe("DELETE /api/communities", () => {
    it("should delete a community", async () => {
      const mockCommunity = {
        _id: mockCommunityId,
        name: "Test Community",
        creator: { _id: mockUserId },
      };

      (Community.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCommunity),
      });
      (Community.findByIdAndDelete as jest.Mock).mockResolvedValue(mockCommunity);

      const request = new NextRequest(
        "http://localhost/api/communities?communityId=" + mockCommunityId,
        { method: "DELETE" }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Community deleted successfully");
      expect(Community.findByIdAndDelete).toHaveBeenCalledWith(mockCommunityId);
    });

    it("should return 400 if communityId is missing", async () => {
      const request = new NextRequest("http://localhost/api/communities", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Community ID is required");
    });

    it("should return 404 if community not found", async () => {
      (Community.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const request = new NextRequest(
        "http://localhost/api/communities?communityId=nonexistent",
        { method: "DELETE" }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Community not found");
    });

    it("should return 403 if user is not the creator", async () => {
      const mockCommunity = {
        _id: mockCommunityId,
        creator: { _id: "different_user" },
      };

      (Community.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCommunity),
      });

      const request = new NextRequest(
        "http://localhost/api/communities?communityId=" + mockCommunityId,
        { method: "DELETE" }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Only the creator can delete the community");
    });
  });

  describe("Error handling", () => {
    it("should handle database connection errors", async () => {
      (connectToDatabase as jest.Mock).mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost/api/communities");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle community save errors", async () => {
      (Community.prototype.save as jest.Mock).mockRejectedValue(new Error("Save failed"));
      (Community.findOne as jest.Mock).mockResolvedValue(null);

      const requestBody = {
        name: "New Test Community",
        description: "A new test community",
        isPrivate: false,
      };

      const request = new NextRequest("http://localhost/api/communities", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
