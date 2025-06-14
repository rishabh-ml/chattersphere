import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { resetAllMocks, mockAuth, mockDbConnect, mockUserModel, mockPostModel } from "@/lib/test-utils";

// Mock the dependencies
jest.mock("@clerk/nextjs/server");
jest.mock("@/lib/dbConnect");
jest.mock("@/models/User");
jest.mock("@/models/Post");
jest.mock("@/models/Community");

describe("/api/posts", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("GET", () => {
    it("should return posts for authenticated user", async () => {
      const mockPosts = [
        {
          _id: "post_1",
          content: "Test post content",
          author: {
            _id: "author_1",
            username: "testuser",
            name: "Test User",
            image: "image.jpg",
          },
          createdAt: new Date(),
          upvoteCount: 5,
          downvoteCount: 1,
          commentCount: 3,
        },
      ];

      mockAuth.mockResolvedValue({ userId: "user_123" });
      
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPosts),
      };
      
      mockPostModel.find.mockReturnValue(mockFind);
      mockPostModel.countDocuments.mockResolvedValue(1);

      const request = new NextRequest("http://localhost:3000/api/posts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(1);
      expect(data.posts[0].content).toBe("Test post content");
    });

    it("should return unauthorized when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost:3000/api/posts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("POST", () => {
    it("should create a new post for authenticated user", async () => {
      const mockUser = { _id: "user_objectid_123", clerkId: "user_123", username: "testuser" };
      const mockPost = {
        _id: "post_123",
        content: "New test post",
        author: "user_objectid_123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPopulatedPost = {
        ...mockPost,
        author: {
          _id: "user_objectid_123",
          username: "testuser",
          name: "Test User",
          image: "image.jpg",
        },
        mediaUrls: [],
      };

      mockAuth.mockResolvedValue({ userId: "user_123" });
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockPostModel.create.mockResolvedValue(mockPost);
      
      const mockPopulate = {
        populate: jest.fn().mockResolvedValue(mockPopulatedPost),
      };
      mockPostModel.findById.mockReturnValue(mockPopulate);

      const request = new NextRequest("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({
          content: "New test post",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.post.content).toBe("New test post");
      expect(mockPostModel.create).toHaveBeenCalledWith({
        content: "New test post",
        author: "user_objectid_123",
        community: undefined,
        mediaUrls: [],
      });
    });

    it("should return validation error for invalid post data", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" });

      const request = new NextRequest("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({
          content: "", // Empty content should fail validation
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation error");
    });

    it("should return unauthorized when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({
          content: "Test post",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });
});
