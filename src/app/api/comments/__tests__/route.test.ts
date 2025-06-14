import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "../route";
import { connectToDatabase } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import User from "@/models/User";

// Mock the dependencies
jest.mock("@/lib/mongodb");
jest.mock("@/models/Comment");
jest.mock("@/models/Post");
jest.mock("@/models/User");
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

const { auth } = require("@clerk/nextjs/server");

describe("/api/comments API", () => {
  const mockUserId = "user_123";
  const mockCommentId = "comment_123";
  const mockPostId = "post_123";

  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue({});
    (auth as jest.Mock).mockReturnValue({ userId: mockUserId });
  });

  describe("GET /api/comments", () => {
    it("should fetch comments for a post", async () => {
      const mockComments = [
        {
          _id: "comment1",
          content: "Test comment 1",
          author: { _id: "user1", username: "testuser1", image: "avatar1.jpg" },
          post: mockPostId,
          createdAt: new Date(),
          upvotes: 5,
          downvotes: 1,
        },
        {
          _id: "comment2",
          content: "Test comment 2",
          author: { _id: "user2", username: "testuser2", image: "avatar2.jpg" },
          post: mockPostId,
          createdAt: new Date(),
          upvotes: 3,
          downvotes: 0,
        },
      ];

      (Comment.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockComments),
            }),
          }),
        }),
      });

      (Comment.countDocuments as jest.Mock).mockResolvedValue(2);

      const request = new NextRequest("http://localhost/api/comments?postId=" + mockPostId);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toHaveLength(2);
      expect(data.comments[0].content).toBe("Test comment 1");
      expect(data.pagination.total).toBe(2);
    });

    it("should return 400 if postId is missing", async () => {
      const request = new NextRequest("http://localhost/api/comments");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Post ID is required");
    });

    it("should return 401 if user is not authenticated", async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const request = new NextRequest("http://localhost/api/comments?postId=" + mockPostId);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("POST /api/comments", () => {
    it("should create a new comment", async () => {
      const mockComment = {
        _id: mockCommentId,
        content: "New test comment",
        author: mockUserId,
        post: mockPostId,
        createdAt: new Date(),
        upvotes: 0,
        downvotes: 0,
      };

      (Comment.prototype.save as jest.Mock).mockResolvedValue(mockComment);
      (Comment.populate as jest.Mock).mockResolvedValue({
        ...mockComment,
        author: { _id: mockUserId, username: "testuser", image: "avatar.jpg" },
      });
      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const requestBody = {
        content: "New test comment",
        postId: mockPostId,
      };

      const request = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.comment.content).toBe("New test comment");
      expect(Comment.prototype.save).toHaveBeenCalled();
      expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPostId,
        { $inc: { commentCount: 1 } }
      );
    });

    it("should return 400 if content is missing", async () => {
      const requestBody = { postId: mockPostId };

      const request = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Content and post ID are required");
    });

    it("should return 401 if user is not authenticated", async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const requestBody = {
        content: "New test comment",
        postId: mockPostId,
      };

      const request = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("PUT /api/comments", () => {
    it("should update a comment", async () => {
      const mockComment = {
        _id: mockCommentId,
        content: "Updated comment content",
        author: { _id: mockUserId },
        save: jest.fn().mockResolvedValue(true),
      };

      (Comment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockComment),
      });

      const requestBody = {
        commentId: mockCommentId,
        content: "Updated comment content",
      };

      const request = new NextRequest("http://localhost/api/comments", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comment.content).toBe("Updated comment content");
      expect(mockComment.save).toHaveBeenCalled();
    });

    it("should return 404 if comment not found", async () => {
      (Comment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const requestBody = {
        commentId: "nonexistent",
        content: "Updated content",
      };

      const request = new NextRequest("http://localhost/api/comments", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Comment not found");
    });

    it("should return 403 if user is not the author", async () => {
      const mockComment = {
        _id: mockCommentId,
        author: { _id: "different_user" },
      };

      (Comment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockComment),
      });

      const requestBody = {
        commentId: mockCommentId,
        content: "Updated content",
      };

      const request = new NextRequest("http://localhost/api/comments", {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("You can only edit your own comments");
    });
  });

  describe("DELETE /api/comments", () => {
    it("should delete a comment", async () => {
      const mockComment = {
        _id: mockCommentId,
        author: { _id: mockUserId },
        post: mockPostId,
      };

      (Comment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockComment),
      });
      (Comment.findByIdAndDelete as jest.Mock).mockResolvedValue(mockComment);
      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const request = new NextRequest(
        "http://localhost/api/comments?commentId=" + mockCommentId,
        { method: "DELETE" }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Comment deleted successfully");
      expect(Comment.findByIdAndDelete).toHaveBeenCalledWith(mockCommentId);
      expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPostId,
        { $inc: { commentCount: -1 } }
      );
    });

    it("should return 400 if commentId is missing", async () => {
      const request = new NextRequest("http://localhost/api/comments", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Comment ID is required");
    });

    it("should return 404 if comment not found", async () => {
      (Comment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const request = new NextRequest(
        "http://localhost/api/comments?commentId=nonexistent",
        { method: "DELETE" }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Comment not found");
    });

    it("should return 403 if user is not the author", async () => {
      const mockComment = {
        _id: mockCommentId,
        author: { _id: "different_user" },
        post: mockPostId,
      };

      (Comment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockComment),
      });

      const request = new NextRequest(
        "http://localhost/api/comments?commentId=" + mockCommentId,
        { method: "DELETE" }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("You can only delete your own comments");
    });
  });

  describe("Error handling", () => {
    it("should handle database connection errors", async () => {
      (connectToDatabase as jest.Mock).mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost/api/comments?postId=" + mockPostId);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle comment save errors", async () => {
      (Comment.prototype.save as jest.Mock).mockRejectedValue(new Error("Save failed"));

      const requestBody = {
        content: "New test comment",
        postId: mockPostId,
      };

      const request = new NextRequest("http://localhost/api/comments", {
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
