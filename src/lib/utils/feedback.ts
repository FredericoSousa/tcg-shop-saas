import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";

function extractErrorDetails(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const err = (data as { error?: unknown }).error;
  if (typeof err !== "object" || err === null) {
    return typeof err === "string" ? err : undefined;
  }
  const details = (err as { details?: unknown }).details;
  if (Array.isArray(details)) {
    const lines = details.filter((d): d is string => typeof d === "string");
    return lines.length ? lines.join("\n") : undefined;
  }
  if (details && typeof details === "object") {
    const lines = Object.values(details as Record<string, unknown>)
      .flat()
      .filter((d): d is string => typeof d === "string");
    return lines.length ? lines.join("\n") : undefined;
  }
  return undefined;
}

/**
 * Standardized feedback utility for the frontend.
 * Wraps sonner toast calls to ensure consistency.
 */
export const feedback = {
  /**
   * Shows a success toast.
   */
  success: (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
    return toast.success(message, {
      description,
      action,
    });
  },


  /**
   * Shows an error toast.
   */
  error: (message: string, description?: string) => {
    return toast.error(message, {
      description,
    });
  },

  /**
   * Handles API errors by extracting the message from ApiError or using a default.
   */
  apiError: (error: unknown, defaultMessage: string = "Ocorreu um erro na operação") => {
    console.error("API Error feedback:", error);

    let message = defaultMessage;
    let description: string | undefined;

    if (error instanceof ApiError) {
      message = error.message;
      description = extractErrorDetails(error.data);
    } else if (error instanceof Error) {
      message = error.message;
    }

    return toast.error(message, {
      description,
    });
  },

  /**
   * Shows a loading toast.
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Wraps a promise with standardized loading, success, and error feedback.
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string | { message: string; description?: string });
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (err) => {
        console.error("Promise Error feedback:", err);
        const errorFeedback = typeof messages.error === "function" ? messages.error(err) : messages.error;
        
        if (typeof errorFeedback === "string") {
          return errorFeedback;
        }
        
        return errorFeedback.message;
      },
    });
  },

  /**
   * Dismisses a specific toast or all toasts.
   */
  dismiss: (toastId?: string | number) => {
    return toast.dismiss(toastId);
  },
};
