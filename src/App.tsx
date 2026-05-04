import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/Homepage";
import BookDetailPage from "./pages/BookDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useState } from "react";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
	const [books, setBooks] = useState([
		{ title: "The Great Gatsby", totalPages: 180 },
		{ title: "Dune", totalPages: 412 },
	]);

	function addBook(title: string) {
		setBooks([...books, { title, totalPages: 0 }]);
	}
	return (
		<Routes>
			<Route path="/" element={<HomePage books={books} onAdd={addBook} />} />
			<Route
				path="/books/:id"
				element={
					<ProtectedRoute>
						<BookDetailPage books={books} />
					</ProtectedRoute>
				}
			/>
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
}
export default App;
