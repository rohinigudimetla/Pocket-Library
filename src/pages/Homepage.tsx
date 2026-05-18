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
		<div className="min-h-screen">
			<Sidebar />
			<main className="ml-[240px] p-10">
				<div className="max-w-5xl mx-auto flex flex-col gap-8">
					{/* Greeting */}
					<div>
						<h1 className="text-3xl font-bold text-ink">
							Good afternoon, {currentUser?.name} 👋
						</h1>
						<p className="text-ink-muted mt-1">Pick up where you left off.</p>
					</div>

					<FeaturedBook />
					<SearchBooks />
					<RequestList />
					{currentUser?.role === "admin" && <AddBookForm onAdd={addBook} />}

					{/* Books grid */}
					<div>
						<h2 className="text-xl font-bold text-ink mb-4">Your Books</h2>
						<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
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
