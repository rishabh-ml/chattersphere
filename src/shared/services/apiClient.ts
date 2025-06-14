/**
 * API client for handling common API interactions
 */

/**
 * Base API client with common functionality
 */
export class ApiClient {
  /**
   * Make a GET request
   */
  static async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "GET",
    });
  }

  /**
   * Make a POST request
   */
  static async post<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a PUT request
   */
  static async put<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a PATCH request
   */
  static async patch<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a DELETE request
   */
  static async delete<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * Generic request method
   */
  static async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError({
        message: errorData.message || "An error occurred",
        status: response.status,
        data: errorData,
      });
    }

    // Check if there's content to parse
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return {} as T;
  }
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor({ message, status, data }: { message: string; status: number; data?: any }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();
