import { useState, useCallback } from "react";

interface UploadResponse {
    success: boolean;
    url: string;
    fileName: string;
    error?: string;
}

export function useLogoManager() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadLogo = useCallback(
        async (file: File, customFileName?: string): Promise<UploadResponse | null> => {
            setIsLoading(true);
            setError(null);

            try {
                // Validate file
                if (!file.type.startsWith("image/")) {
                    throw new Error("Please upload a valid image file");
                }

                if (file.size > 5 * 1024 * 1024) {
                    throw new Error("File size must be less than 5MB");
                }

                const formData = new FormData();
                formData.append("file", file);

                const fileName =
                    customFileName ||
                    `logo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                formData.append("fileName", fileName);

                const response = await fetch("/api/admin/logos", {
                    method: "POST",
                    body: formData,
                });

                const data: UploadResponse = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to upload logo");
                }

                return data;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Unknown error occurred";
                setError(errorMessage);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    const getLogo = useCallback(
        async (fileName: string): Promise<string | null> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/admin/logos?fileName=${encodeURIComponent(fileName)}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to retrieve logo");
                }

                return data.url;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Unknown error occurred";
                setError(errorMessage);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    const deleteLogo = useCallback(
        async (fileName: string): Promise<boolean> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/api/admin/logos?fileName=${encodeURIComponent(fileName)}`,
                    {
                        method: "DELETE",
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to delete logo");
                }

                return true;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Unknown error occurred";
                setError(errorMessage);
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    return {
        uploadLogo,
        getLogo,
        deleteLogo,
        isLoading,
        error,
        clearError: () => setError(null),
    };
}
