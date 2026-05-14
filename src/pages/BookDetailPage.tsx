import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

function BookDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { books } = useAppContext();
	const book = books[Number(id)];

	if (!book) return <div>Book not found</div>;

	return (
		<div>
			<button onClick={() => navigate("/")}>Back to Home</button>
			<h2>{book.title}</h2>
			<p>Total pages: {book.totalPages}</p>
		</div>
	);
}

export default BookDetailPage;
