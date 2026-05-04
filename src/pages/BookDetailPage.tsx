import { useNavigate, useParams } from "react-router-dom";
interface BookDetailPageProps {
	books: { title: string; totalPages: number }[];
}
function BookDetailPage({ books }: BookDetailPageProps) {
	const { id } = useParams();
	const navigate = useNavigate();
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
