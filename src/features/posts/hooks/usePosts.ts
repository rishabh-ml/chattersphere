/**
 * Custom hooks for posts
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPosts,
  getPost,
  createPost,
  deletePost,
  upvotePost,
  downvotePost,
  savePost,
  unsavePost,
} from "../services/postsService";
import { Post, PostCreateInput, PostsQueryParams } from "../types/post";

/**
 * Hook to fetch posts with pagination and filtering
 */
export function usePostsQuery(params: PostsQueryParams = {}) {
  const { page = 1, limit = 10, sort = "newest", communityId, userId } = params;
  return useQuery({
    queryKey: ["posts", { page, limit, sort, communityId, userId }],
    queryFn: () => getPosts({ page, limit, sort, communityId, userId }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single post
 */
export function usePostQuery(postId: string) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPost(postId),
    enabled: !!postId,
  });
}

/**
 * Hook for creating a new post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PostCreateInput) => createPost(data),
    onSuccess: () => {
      // Invalidate posts queries to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/**
 * Hook for deleting a post
 */
export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: (_, postId) => {
      // Invalidate specific post query
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      // Invalidate posts list
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/**
 * Hook for upvoting a post
 */
export function useUpvotePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => upvotePost(postId),
    onMutate: async (postId) => {
      // Optimistically update the UI
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      const previousPost = queryClient.getQueryData<{ post: Post }>(["post", postId]);

      if (previousPost) {
        queryClient.setQueryData(["post", postId], {
          post: {
            ...previousPost.post,
            upvoteCount: previousPost.post.isUpvoted
              ? previousPost.post.upvoteCount - 1
              : previousPost.post.upvoteCount + 1,
            downvoteCount: previousPost.post.isDownvoted
              ? previousPost.post.downvoteCount - 1
              : previousPost.post.downvoteCount,
            voteCount: previousPost.post.isUpvoted
              ? previousPost.post.voteCount - 1
              : previousPost.post.isDownvoted
                ? previousPost.post.voteCount + 2
                : previousPost.post.voteCount + 1,
            isUpvoted: !previousPost.post.isUpvoted,
            isDownvoted: false,
          },
        });
      }

      return { previousPost };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(["post", context.previousPost.post.id], context.previousPost);
      }
    },
    onSettled: (_, __, postId) => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/**
 * Hook for downvoting a post
 */
export function useDownvotePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => downvotePost(postId),
    onMutate: async (postId) => {
      // Optimistically update the UI
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      const previousPost = queryClient.getQueryData<{ post: Post }>(["post", postId]);

      if (previousPost) {
        queryClient.setQueryData(["post", postId], {
          post: {
            ...previousPost.post,
            upvoteCount: previousPost.post.isUpvoted
              ? previousPost.post.upvoteCount - 1
              : previousPost.post.upvoteCount,
            downvoteCount: previousPost.post.isDownvoted
              ? previousPost.post.downvoteCount - 1
              : previousPost.post.downvoteCount + 1,
            voteCount: previousPost.post.isDownvoted
              ? previousPost.post.voteCount + 1
              : previousPost.post.isUpvoted
                ? previousPost.post.voteCount - 2
                : previousPost.post.voteCount - 1,
            isDownvoted: !previousPost.post.isDownvoted,
            isUpvoted: false,
          },
        });
      }

      return { previousPost };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(["post", context.previousPost.post.id], context.previousPost);
      }
    },
    onSettled: (_, __, postId) => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/**
 * Hook for saving/unsaving a post
 */
export function useSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, save }: { postId: string; save: boolean }) =>
      save ? savePost(postId) : unsavePost(postId),
    onMutate: async ({ postId, save }) => {
      // Optimistically update the UI
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      const previousPost = queryClient.getQueryData<{ post: Post }>(["post", postId]);

      if (previousPost) {
        queryClient.setQueryData(["post", postId], {
          post: {
            ...previousPost.post,
            isSaved: save,
          },
        });
      }

      return { previousPost };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(["post", context.previousPost.post.id], context.previousPost);
      }
    },
    onSettled: (_, __, { postId }) => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Also invalidate saved posts
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}
