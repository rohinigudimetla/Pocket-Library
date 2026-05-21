import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";

function BookDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { books } = useAppContext();
	const book = books[Number(id)];

	if (!book)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-heading-h2 text-ink-muted">Book not found</p>
			</div>
		);

	return (
		<div className="min-h-screen bg-surface-page">
			<Sidebar />
			<main className="ml-[var(--sidebar-width)] p-inset-xl">
				<div className="max-w-[var(--layout-content-max)] mx-auto">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate("/")}
						className="mb-inset-lg"
					>
						← Back to Home
					</Button>
					<div className="noise relative bg-surface rounded-surface shadow-card p-inset-xl overflow-hidden">
						<h2 className="text-heading-h1 text-ink">{book.title}</h2>
						<p className="text-button-md text-ink-muted mt-[8px]">
							Total pages: {book.totalPages}
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}

export default BookDetailPage;
