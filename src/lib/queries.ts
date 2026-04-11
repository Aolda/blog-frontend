import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  User,
  Token,
  PostTemplate,
  PostResponse,
  PostSummaryResponse,
  ImageUploadResponse,
  ImageResponse,
  PostContentUpdateRequest,
  UpdateProfileRequest,
  AuthorResponse,
} from "@/types";

// This is a local workaround for React StrictMode's double-invoked mount effects in development.
// TanStack Query deduplicates queries by queryKey, but mutations do not have built-in request dedupe.
let pendingPostTemplateRequest: Promise<PostTemplate> | null = null;

export function useMe() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<User>("/users/me");
      return data;
    },
  });
}

export function useAuthors(skip = 0, limit = 100) {
  return useQuery<AuthorResponse[]>({
    queryKey: ["authors", skip, limit],
    queryFn: async () => {
      const { data } = await api.get<AuthorResponse[]>("/users/authors", {
        params: { skip, limit },
      });
      return data;
    },
  });
}

export function useUser(username: string) {
  return useQuery<AuthorResponse>({
    queryKey: ["user", username],
    queryFn: async () => {
      const { data } = await api.get<AuthorResponse>(`/users/${username}`);
      return data;
    },
    enabled: !!username,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, UpdateProfileRequest>({
    mutationFn: async (body) => {
      const { data } = await api.put<User>("/users/me", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function usePosts(page = 1, limit = 20) {
  return useQuery<PostSummaryResponse[]>({
    queryKey: ["posts", page, limit],
    queryFn: async () => {
      const { data } = await api.get<PostSummaryResponse[]>("/posts", {
        params: { page, limit },
      });
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function usePost(postId: number | null) {
  return useQuery<PostResponse>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data } = await api.get<PostResponse>(`/posts/${postId}`);
      return data;
    },
    enabled: postId !== null,
  });
}

export function useCreatePostTemplate() {
  return useMutation<PostTemplate, Error, void>({
    mutationFn: async () => {
      if (!pendingPostTemplateRequest) {
        pendingPostTemplateRequest = api
          .post<PostTemplate>("/posts/template")
          .then(({ data }) => data)
          .finally(() => {
            pendingPostTemplateRequest = null;
          });
      }

      return pendingPostTemplateRequest;
    },
  });
}

export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation<ImageUploadResponse, Error, { postId: number; file: File }>({
    mutationFn: async ({ postId, file }) => {
      const formData = new FormData();
      formData.append("post_id", String(postId));
      formData.append("file", file);
      const { data } = await api.post<ImageUploadResponse>("/images/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["postImages", variables.postId] });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { imageId: number; postId: number }>({
    mutationFn: async ({ imageId }) => {
      await api.delete(`/images/${imageId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["postImages", variables.postId] });
    },
  });
}

export function usePostImages(postId: number | null) {
  return useQuery<ImageResponse[]>({
    queryKey: ["postImages", postId],
    queryFn: async () => {
      const { data } = await api.get<ImageResponse[]>(`/images/posts/${postId}`);
      return data;
    },
    enabled: postId !== null,
  });
}

export function useSavePostContent() {
  const queryClient = useQueryClient();
  return useMutation<
    PostResponse,
    Error,
    {
      postId: number;
      title: string | null;
      description: string | null;
      tags: string[];
      image: string | null;
      content: string;
      authors?: string[];
    }
  >({
    mutationFn: async ({ postId, title, description, tags, image, content, authors }) => {
      const body: PostContentUpdateRequest = {
        title,
        description,
        tags,
        image,
        content,
        authors,
      };
      const { data } = await api.put<PostResponse>(`/posts/${postId}/content`, body);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (postId) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useRefreshToken() {
  return useMutation<Token, Error, string>({
    mutationFn: async (refreshToken) => {
      const { data } = await api.post<Token>("/auth/refresh", {
        refresh_token: refreshToken,
      });
      return data;
    },
  });
}
