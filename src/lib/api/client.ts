import { ApiResponseData } from "@/lib/infrastructure/http/api-response";

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new ApiError(
      data.message || response.statusText || "Request failed",
      response.status,
      data
    );
  }

  return data as T;
}

export const apiClient = {
  async get<T>(url: string, options?: RequestInit): Promise<ApiResponseData<T>> {
    const response = await fetch(url, {
      ...options,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    return handleResponse<ApiResponseData<T>>(response);
  },

  async post<T>(url: string, body?: any, options?: RequestInit): Promise<ApiResponseData<T>> {
    const response = await fetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<ApiResponseData<T>>(response);
  },

  async put<T>(url: string, body?: any, options?: RequestInit): Promise<ApiResponseData<T>> {
    const response = await fetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<ApiResponseData<T>>(response);
  },

  async patch<T>(url: string, body?: any, options?: RequestInit): Promise<ApiResponseData<T>> {
    const response = await fetch(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<ApiResponseData<T>>(response);
  },

  async delete<T>(url: string, body?: any, options?: RequestInit): Promise<ApiResponseData<T>> {
    const response = await fetch(url, {
      ...options,
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<ApiResponseData<T>>(response);
  },
};
