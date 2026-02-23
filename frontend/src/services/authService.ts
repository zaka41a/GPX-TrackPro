import { LoginCredentials, RegisterData, User } from "@/types";
import { apiFetch, ApiError, clearToken, getToken, setToken } from "./api";

type BackendUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "rejected";
  avatarUrl: string;
  createdAt: string;
};

type LoginResponse = {
  token: string;
  user: BackendUser;
};

type RegisterResponse = {
  message: string;
  user: BackendUser;
};

const USER_KEY = "gpx_auth_user";

function mapUser(u: BackendUser): User {
  return {
    id: String(u.id),
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    role: u.role,
    status: u.status,
    avatarUrl: u.avatarUrl || "",
    createdAt: u.createdAt
  };
}

function saveUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

export const authService = {
  async login(creds: LoginCredentials): Promise<User> {
    const result = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: creds.email, password: creds.password })
    });

    const user = mapUser(result.user);
    setToken(result.token);
    saveUser(user);
    return user;
  },

  async register(data: RegisterData): Promise<User> {
    const [firstName, ...rest] = data.name.trim().split(/\s+/);
    const lastName = rest.join(" ") || "User";

    const result = await apiFetch<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: firstName || "User",
        lastName,
        email: data.email,
        password: data.password
      })
    });

    return mapUser(result.user);
  },

  async logout(): Promise<void> {
    const token = getToken();
    if (token) {
      try {
        await apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" }, true);
      } catch {
        // No-op: local logout still required.
      }
    }
    clearToken();
    clearUser();
  },

  async getMe(): Promise<User | null> {
    const token = getToken();
    if (!token) return null;

    try {
      const user = await apiFetch<BackendUser>("/api/auth/me", undefined, true);
      const mapped = mapUser(user);
      saveUser(mapped);
      return mapped;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        clearUser();
        return null;
      }
      throw err;
    }
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
};
