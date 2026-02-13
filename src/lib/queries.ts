import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  User,
  Token,
  PostTemplate,
  ImageUploadResponse,
  LoginRequest,
  RegisterRequest,
  GoogleFinishRequest,
  GoogleFinishResponse,
  UpdateProfileRequest,
} from "@/types";

export function useMe() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<User>("/users/me");
      return data;
    },
  });
}

export function useUsers(page = 1, limit = 10) {
  return useQuery<User[]>({
    queryKey: ["users", page, limit],
    queryFn: async () => {
      const { data } = await api.get<User[]>("/users/", {
        params: { page, limit },
      });
      return data;
    },
  });
}

export function useUser(username: string) {
  return useQuery<User>({
    queryKey: ["user", username],
    queryFn: async () => {
      const { data } = await api.get<User>(`/users/${username}`);
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

export function useCreateTemplate() {
  return useMutation<PostTemplate, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<PostTemplate>("/posts/template");
      return data;
    },
  });
}

export function useUploadImage() {
  return useMutation<ImageUploadResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<ImageUploadResponse>("/images/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
  });
}

export function useDeleteImage() {
  return useMutation<void, Error, string>({
    mutationFn: async (filename) => {
      await api.delete(`/images/${filename}`);
    },
  });
}

export function useLogin() {
  return useMutation<Token, Error, LoginRequest>({
    mutationFn: async (body) => {
      const { data } = await api.post<Token>("/auth/login", body);
      return data;
    },
  });
}

export function useRegister() {
  return useMutation<User, Error, RegisterRequest>({
    mutationFn: async (body) => {
      const { data } = await api.post<User>("/auth/register", body);
      return data;
    },
  });
}

export function useGoogleFinish() {
  return useMutation<GoogleFinishResponse, Error, GoogleFinishRequest>({
    mutationFn: async (body) => {
      const { data } = await api.post<GoogleFinishResponse>("/auth/google/finish", body);
      return data;
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
