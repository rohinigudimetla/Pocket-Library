import FeaturedBook from "../components/FeaturedBook";
import SearchBooks from "../components/SearchBooks";
import AddBookForm from "../forms/AddBookForm";
import BookCard from "../components/BookCard";
import RequestList from "../components/RequestList";
import Sidebar from "../components/Sidebar";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

function HomePage() {
	const { books, addBook } = useAppContext();
	const { currentUser } = useAuth();

	return (
		<div className="min-h-screen bg-surface-page">
			<Sidebar />
			<main className="ml-[var(--sidebar-width)] p-inset-xl">
				<div
					className="max-w-[var(--layout-content-max)] mx-auto flex flex-col gap-stack-xl"
				>
					{/* Greeting */}
					<div>
						<h1 className="text-heading-h1 text-ink">
							Good afternoon, {currentUser?.name} 👋
						</h1>
						<p className="text-button-md text-ink-muted mt-[6px]">
							Pick up where you left off.
						</p>
					</div>

					<FeaturedBook />
					<SearchBooks />
					<RequestList />
					{currentUser?.role === "admin" && <AddBookForm onAdd={addBook} />}

					{/* Books grid */}
					<div>
						<h2 className="text-heading-h2 text-ink mb-inset-lg">
							Your Books
						</h2>
						<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-inset-lg">
							{books.map((book, i) => (
								<BookCard
									key={i}
									id={i}
									title={book.title}
									totalPages={book.totalPages}
								/>
							))}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default HomePage;
