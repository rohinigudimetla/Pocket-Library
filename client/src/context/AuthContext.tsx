import { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../types";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const AuthContext = createContext<{
	currentUser: User | null;
	token: string | null;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<boolean>;
	logout: () => Promise<void>;
	refreshAccessToken: () => Promise<string | null>;
}>({
	currentUser: null,
	token: null,
	isLoading: true,
	login: async () => false,
	logout: async () => {},
	refreshAccessToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedToken = sessionStorage.getItem("accessToken");
		const storedRefresh = sessionStorage.getItem("refreshToken");

		if (storedToken && storedRefresh && storedRefresh !== "undefined") {
			const payload = JSON.parse(atob(storedToken.split(".")[1]));
			const isExpired = payload.exp * 1000 < Date.now();

			if (!isExpired) {
				setToken(storedToken);
				setCurrentUser({
					name: payload.sub,
					role: payload.role.toLowerCase() as "reader" | "admin",
				});
			} else {
				sessionStorage.removeItem("accessToken");
				sessionStorage.removeItem("refreshToken");
			}
		}
		setIsLoading(false);
	}, []);

	async function refreshAccessToken(): Promise<string | null> {
		const storedRefresh = sessionStorage.getItem("refreshToken");
		if (!storedRefresh) return null;

		const response = await fetch(`${API_URL}/api/auth/refresh`, {
			method: "POST",
			headers: { Authorization: `Bearer ${storedRefresh}` },
		});

		if (!response.ok) {
			setCurrentUser(null);
			setToken(null);
			sessionStorage.removeItem("accessToken");
			sessionStorage.removeItem("refreshToken");
			return null;
		}

		const data = await response.json();
		setToken(data.token);
		sessionStorage.setItem("accessToken", data.token);
		return data.token;
	}

	async function login(email: string, password: string): Promise<boolean> {
		const response = await fetch(`${API_URL}/api/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: email, password }),
		});

		if (!response.ok) return false;

		const data = await response.json();
		setToken(data.token);
		sessionStorage.setItem("accessToken", data.token);
		sessionStorage.setItem("refreshToken", data.refreshToken);

		const payload = JSON.parse(atob(data.token.split(".")[1]));
		setCurrentUser({
			name: email,
			role: payload.role.toLowerCase() as "reader" | "admin",
		});

		return true;
	}

	async function logout() {
		if (token) {
			await fetch(`${API_URL}/api/auth/logout`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
			});
		}
		setCurrentUser(null);
		setToken(null);
		sessionStorage.removeItem("accessToken");
		sessionStorage.removeItem("refreshToken");
	}

	return (
		<AuthContext.Provider
			value={{
				currentUser,
				token,
				isLoading,
				login,
				logout,
				refreshAccessToken,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}

export default AuthContext;
