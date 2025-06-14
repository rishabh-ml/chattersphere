import { NextRequest } from "next/server";
import { GET } from "../route";
import { resetAllMocks, mockAuth, mockDbConnect, mockUserModel, mockNotificationModel } from "@/lib/test-utils";

// Mock the dependencies
jest.mock("@clerk/nextjs/server");
jest.mock("@/lib/dbConnect");
jest.mock("@/models/User");
jest.mock("@/models/Notification");
jest.mock("@/lib/mongooseUtils", () => ({
  getPaginationOptions: jest.fn((page, limit) => ({ skip: (page - 1) * limit, limit })),
}));

describe("/api/notifications", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("GET", () => {
    it("should return unauthorized when user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost:3000/api/notifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return empty notifications when user not found in database", async () => {
      mockAuth.mockResolvedValue({ userId: "user_123" });
      mockUserModel.findOne.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/notifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notifications).toEqual([]);
      expect(data.unreadCount).toBe(0);
      expect(data.pagination.totalNotifications).toBe(0);
    });

    it("should return notifications for authenticated user", async () => {
      const mockUser = { _id: "user_objectid_123", clerkId: "user_123" };
      const mockNotifications = [
        {
          _id: "notification_1",
          type: "like",
          message: "Someone liked your post",
          read: false,
          createdAt: new Date(),
          sender: {
            _id: "sender_1",
            username: "sender",
            name: "Sender User",
            image: "image.jpg",
          },
        },
      ];

      mockAuth.mockResolvedValue({ userId: "user_123" });
      mockUserModel.findOne.mockResolvedValue(mockUser);
      
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockNotifications),
      };
      
      mockNotificationModel.find.mockReturnValue(mockFind);
      mockNotificationModel.countDocuments
        .mockResolvedValueOnce(1) // total count
        .mockResolvedValueOnce(1); // unread count

      const request = new NextRequest("http://localhost:3000/api/notifications");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notifications).toHaveLength(1);
      expect(data.notifications[0].id).toBe("notification_1");
      expect(data.unreadCount).toBe(1);
    });

    it("should handle pagination parameters", async () => {
      const mockUser = { _id: "user_objectid_123", clerkId: "user_123" };
      
      mockAuth.mockResolvedValue({ userId: "user_123" });
      mockUserModel.findOne.mockResolvedValue(mockUser);
      
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      
      mockNotificationModel.find.mockReturnValue(mockFind);
      mockNotificationModel.countDocuments.mockResolvedValue(0);

      const request = new NextRequest("http://localhost:3000/api/notifications?page=2&limit=10");
      await GET(request);

      expect(mockFind.skip).toHaveBeenCalledWith(10);
      expect(mockFind.limit).toHaveBeenCalledWith(10);
    });

    it("should filter unread notifications when unreadOnly=true", async () => {
      const mockUser = { _id: "user_objectid_123", clerkId: "user_123" };
      
      mockAuth.mockResolvedValue({ userId: "user_123" });
      mockUserModel.findOne.mockResolvedValue(mockUser);
      
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      
      mockNotificationModel.find.mockReturnValue(mockFind);
      mockNotificationModel.countDocuments.mockResolvedValue(0);

      const request = new NextRequest("http://localhost:3000/api/notifications?unreadOnly=true");
      await GET(request);

      expect(mockNotificationModel.find).toHaveBeenCalledWith({
        recipient: "user_objectid_123",
        read: false,
      });
    });
  });
});
