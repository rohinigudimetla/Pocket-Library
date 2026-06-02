import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/Homepage";
import BookDetailPage from "./pages/BookDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";

function App() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<HomePage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/books/:id"
				element={
					<ProtectedRoute>
						<BookDetailPage />
					</ProtectedRoute>
				}
			/>
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}
export default App;
