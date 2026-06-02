import { createContext, useContext, useState } from "react";
import type { User } from "../types";
// type User = {
// 	name: string;
// 	role: "reader" | "admin";
// };

const hardcodedUsers = [
	{
		email: "r@p",
		password: "r",
		name: "Rohini",
		role: "reader" as const,
	},
	{
		email: "a@p",
		password: "a",
		name: "Admin",
		role: "admin" as const,
	},
];

const AuthContext = createContext<{
	currentUser: User | null;
	login: (email: string, password: string) => boolean;
	logout: () => void;
}>({
	currentUser: null,
	login: () => false,
	logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	function login(email: string, password: string): boolean {
		const user = hardcodedUsers.find(
			(u) => u.email === email && u.password === password,
		);
		if (user) {
			setCurrentUser({ name: user.name, role: user.role });
			return true;
		}
		return false;
	}

	function logout() {
		setCurrentUser(null);
	}

	return (
		<AuthContext.Provider value={{ currentUser, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
export default AuthContext;
