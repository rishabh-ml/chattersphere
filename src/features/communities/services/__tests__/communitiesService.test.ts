import * as communitiesService from "../communitiesService";
import { ApiClient } from "@/shared/api/client";

// Mock the ApiClient
jest.mock("@/shared/api/client", () => ({
  ApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("Communities Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCommunities", () => {
    it("should fetch communities with default parameters", async () => {
      const mockResponse = {
        communities: [
          {
            id: "1",
            name: "React Developers",
            slug: "react-developers",
            description: "A community for React developers",
            memberCount: 150,
            isPrivate: false,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          hasMore: false,
        },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.getCommunities();

      expect(ApiClient.get).toHaveBeenCalledWith("/api/communities?page=1&limit=20");
      expect(result).toEqual(mockResponse);
    });

    it("should fetch communities with custom parameters", async () => {
      const mockResponse = {
        communities: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          hasMore: false,
        },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const options = {
        page: 2,
        limit: 10,
        search: "javascript",
        sortBy: "newest" as const,
      };

      await communitiesService.getCommunities(options);

      expect(ApiClient.get).toHaveBeenCalledWith(
        "/api/communities?page=2&limit=10&search=javascript&sortBy=newest"
      );
    });

    it("should handle empty search parameter", async () => {
      const mockResponse = {
        communities: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          hasMore: false,
        },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await communitiesService.getCommunities({ search: "" });

      expect(ApiClient.get).toHaveBeenCalledWith("/api/communities?page=1&limit=20");
    });
  });

  describe("getCommunityBySlug", () => {
    it("should fetch community by slug", async () => {
      const mockCommunity = {
        id: "1",
        name: "React Developers",
        slug: "react-developers",
        description: "A community for React developers",
        memberCount: 150,
        isPrivate: false,
      };

      (ApiClient.get as jest.Mock).mockResolvedValue({ community: mockCommunity });

      const result = await communitiesService.getCommunityBySlug("react-developers");

      expect(ApiClient.get).toHaveBeenCalledWith("/api/communities/react-developers");
      expect(result).toEqual({ community: mockCommunity });
    });

    it("should handle community not found", async () => {
      (ApiClient.get as jest.Mock).mockRejectedValue(new Error("Community not found"));

      await expect(communitiesService.getCommunityBySlug("nonexistent")).rejects.toThrow(
        "Community not found"
      );
    });
  });

  describe("createCommunity", () => {
    it("should create a new community", async () => {
      const communityData = {
        name: "New Community",
        description: "A new test community",
        isPrivate: false,
      };

      const mockResponse = {
        community: {
          id: "new-community-id",
          ...communityData,
          slug: "new-community",
          memberCount: 1,
          postCount: 0,
        },
      };

      (ApiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.createCommunity(communityData);

      expect(ApiClient.post).toHaveBeenCalledWith("/api/communities", communityData);
      expect(result).toEqual(mockResponse);
    });

    it("should handle community creation errors", async () => {
      const communityData = {
        name: "Duplicate Community",
        description: "A community with duplicate name",
        isPrivate: false,
      };

      (ApiClient.post as jest.Mock).mockRejectedValue(
        new Error("A community with this name already exists")
      );

      await expect(communitiesService.createCommunity(communityData)).rejects.toThrow(
        "A community with this name already exists"
      );
    });
  });

  describe("updateCommunity", () => {
    it("should update community", async () => {
      const updateData = {
        description: "Updated description",
        isPrivate: true,
      };

      const mockResponse = {
        community: {
          id: "1",
          name: "React Developers",
          slug: "react-developers",
          ...updateData,
        },
      };

      (ApiClient.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.updateCommunity("react-developers", updateData);

      expect(ApiClient.patch).toHaveBeenCalledWith("/api/communities/react-developers", updateData);
      expect(result).toEqual(mockResponse);
    });

    it("should handle unauthorized update", async () => {
      const updateData = {
        description: "Updated description",
      };

      (ApiClient.patch as jest.Mock).mockRejectedValue(
        new Error("You don't have permission to update this community")
      );

      await expect(
        communitiesService.updateCommunity("react-developers", updateData)
      ).rejects.toThrow("You don't have permission to update this community");
    });
  });

  describe("deleteCommunity", () => {
    it("should delete community", async () => {
      const mockResponse = { success: true };

      (ApiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.deleteCommunity("react-developers");

      expect(ApiClient.delete).toHaveBeenCalledWith("/api/communities/react-developers");
      expect(result).toEqual(mockResponse);
    });

    it("should handle unauthorized deletion", async () => {
      (ApiClient.delete as jest.Mock).mockRejectedValue(
        new Error("Only the creator can delete the community")
      );

      await expect(communitiesService.deleteCommunity("react-developers")).rejects.toThrow(
        "Only the creator can delete the community"
      );
    });
  });

  describe("joinCommunity", () => {
    it("should join community successfully", async () => {
      const mockResponse = { success: true };

      (ApiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.joinCommunity("react-developers");

      expect(ApiClient.post).toHaveBeenCalledWith("/api/communities/react-developers/join", {});
      expect(result).toEqual(mockResponse);
    });

    it("should handle join with approval required", async () => {
      const mockResponse = { success: true, isPending: true };

      (ApiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.joinCommunity("private-community");

      expect(result).toEqual(mockResponse);
      expect(result.isPending).toBe(true);
    });

    it("should handle already member error", async () => {
      (ApiClient.post as jest.Mock).mockRejectedValue(
        new Error("You are already a member of this community")
      );

      await expect(communitiesService.joinCommunity("react-developers")).rejects.toThrow(
        "You are already a member of this community"
      );
    });
  });

  describe("leaveCommunity", () => {
    it("should leave community successfully", async () => {
      const mockResponse = { success: true };

      (ApiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.leaveCommunity("react-developers");

      expect(ApiClient.delete).toHaveBeenCalledWith("/api/communities/react-developers/membership");
      expect(result).toEqual(mockResponse);
    });

    it("should handle not member error", async () => {
      (ApiClient.delete as jest.Mock).mockRejectedValue(
        new Error("You are not a member of this community")
      );

      await expect(communitiesService.leaveCommunity("react-developers")).rejects.toThrow(
        "You are not a member of this community"
      );
    });
  });

  describe("getCommunityMembers", () => {
    it("should fetch community members with default parameters", async () => {
      const mockResponse = {
        members: [
          {
            id: "user1",
            username: "johndoe",
            name: "John Doe",
            image: "avatar1.jpg",
            role: "member",
            joinedAt: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          hasMore: false,
        },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.getCommunityMembers("react-developers");

      expect(ApiClient.get).toHaveBeenCalledWith(
        "/api/communities/react-developers/members?page=1&limit=20"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should fetch community members with custom options", async () => {
      const mockResponse = {
        members: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          hasMore: false,
        },
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const options = {
        page: 2,
        limit: 10,
        role: "moderator",
      };

      await communitiesService.getCommunityMembers("react-developers", options);

      expect(ApiClient.get).toHaveBeenCalledWith(
        "/api/communities/react-developers/members?page=2&limit=10&role=moderator"
      );
    });
  });

  describe("updateMemberRole", () => {
    it("should update member role", async () => {
      const mockResponse = { success: true };

      (ApiClient.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.updateMemberRole(
        "react-developers",
        "user123",
        "moderator"
      );

      expect(ApiClient.patch).toHaveBeenCalledWith(
        "/api/communities/react-developers/members/user123/role",
        { role: "moderator" }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle unauthorized role update", async () => {
      (ApiClient.patch as jest.Mock).mockRejectedValue(
        new Error("You don't have permission to update member roles")
      );

      await expect(
        communitiesService.updateMemberRole("react-developers", "user123", "moderator")
      ).rejects.toThrow("You don't have permission to update member roles");
    });
  });

  describe("removeMember", () => {
    it("should remove member from community", async () => {
      const mockResponse = { success: true };

      (ApiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await communitiesService.removeMember("react-developers", "user123");

      expect(ApiClient.delete).toHaveBeenCalledWith(
        "/api/communities/react-developers/members/user123"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle unauthorized member removal", async () => {
      (ApiClient.delete as jest.Mock).mockRejectedValue(
        new Error("You don't have permission to remove members")
      );

      await expect(
        communitiesService.removeMember("react-developers", "user123")
      ).rejects.toThrow("You don't have permission to remove members");
    });
  });

  describe("Error handling", () => {
    it("should propagate network errors", async () => {
      (ApiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));

      await expect(communitiesService.getCommunities()).rejects.toThrow("Network error");
    });

    it("should handle API client errors", async () => {
      const apiError = {
        message: "Internal server error",
        status: 500,
      };

      (ApiClient.post as jest.Mock).mockRejectedValue(apiError);

      await expect(
        communitiesService.createCommunity({
          name: "Test",
          description: "Test community",
          isPrivate: false,
        })
      ).rejects.toEqual(apiError);
    });
  });
});
