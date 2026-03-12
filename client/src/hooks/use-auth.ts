import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blink } from "../lib/blink";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  city: string;
  phone?: string;
}

// API URL for edge function
const API_URL = "https://e6pb5nhn--api.functions.blink.new";

async function fetchUser(): Promise<User | null> {
  try {
    // Check local blink auth state first
    const authUser = await blink.auth.me();

    if (!authUser) {
      return null;
    }

    // Get the JWT token to pass to edge function
    const token = await blink.auth.getValidToken();

    // Get additional user data from API, passing auth token
    const response = await fetch(`${API_URL}/api/auth/user`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (response.status === 401) {
      return null;
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

async function logout(): Promise<void> {
  await blink.auth.logout();
  window.location.href = "/";
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
