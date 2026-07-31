import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../routes/ProtectedRoute";
import AuthContext from "../../context/AuthContext";

const mockAuthContext = (
	currentUser: { name: string; role: "reader" | "admin" } | null,
) => ({
	currentUser,
	token: currentUser ? "fake-token" : null,
	login: async () => false,
	logout: async () => {},
});

function renderWithRouter(
	currentUser: { name: string; role: "reader" | "admin" } | null,
) {
	return render(
		<AuthContext.Provider value={mockAuthContext(currentUser)}>
			<MemoryRouter initialEntries={["/dashboard"]}>
				<Routes>
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<div>Protected Content</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/login" element={<div>Login Page</div>} />
				</Routes>
			</MemoryRouter>
		</AuthContext.Provider>,
	);
}

test("redirects unauthenticated user to login", () => {
	renderWithRouter(null);
	expect(screen.getByText("Login Page")).toBeInTheDocument();
});

test("renders children for authenticated user", () => {
	renderWithRouter({ name: "rohini", role: "reader" as const });
	expect(screen.getByText("Protected Content")).toBeInTheDocument();
});
