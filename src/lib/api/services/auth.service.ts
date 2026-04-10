import { apiClient } from "../client";

export const AuthService = {
  async login(username: string, password: string, tenantId: string) {
    return apiClient.post<{ success: boolean; message?: string }>("/api/auth/login", {
      username,
      password,
      tenantId,
    });
  },
};
