import { createContext, useContext, useState } from "react";
import type { User } from "../types";
// type User = {
// 	name: string;
// 	role: "reader" | "admin";
// };

// const hardcodedUsers = [
// 	{
// 		email: "r@p",
// 		password: "r",
// 		name: "Rohini",
// 		role: "reader" as const,
// 	},
// 	{
// 		email: "a@p",
// 		password: "a",
// 		name: "Admin",
// 		role: "admin" as const,
// 	},
// ];

const AuthContext = createContext<{
	currentUser: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<boolean>;
	logout: () => Promise<void>;
}>({
	currentUser: null,
	token: null,
	login: async () => false,
	logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	// The token is held in plain React state, not localStorage. localStorage
	// is readable by any script running on the page, which makes it a
	// target for XSS. Keeping it in state means a page refresh clears it,
	// which is an accepted tradeoff for this module.
	const [token, setToken] = useState<string | null>(null);

	async function login(email: string, password: string): Promise<boolean> {
		const response = await fetch("http://localhost:8080/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: email, password }),
		});

		if (!response.ok) {
			return false;
		}

		const data = await response.json();
		setToken(data.token);

		// The server's token carries the role, but the frontend still needs
		// a display name and a role to render the UI correctly. Decoding
		// the role straight out of the JWT payload is the simplest path
		// here, without adding a library just to read one field.
		const payload = JSON.parse(atob(data.token.split(".")[1]));
		setCurrentUser({
			name: email,
			role: payload.role.toLowerCase() as "reader" | "admin",
		});

		return true;
	}

	async function logout() {
		if (token) {
			await fetch("http://localhost:8080/api/auth/logout", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
		}
		setCurrentUser(null);
		setToken(null);
	}

	return (
		<AuthContext.Provider value={{ currentUser, token, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
export default AuthContext;
