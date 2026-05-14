import FeaturedBook from "../components/FeaturedBook";
import SearchBooks from "../components/SearchBooks";
import AddBookForm from "../forms/AddBookForm";
import BookCard from "../components/BookCard";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

function HomePage() {
	const { books, addBook } = useAppContext();
	const { currentUser, logout } = useAuth();

	return (
		<div>
			<button onClick={logout}>Logout</button>
			<h1>PocketLibrary</h1>
			<FeaturedBook />
			<SearchBooks />
			{currentUser?.role === "admin" && <AddBookForm onAdd={addBook} />}
			{books.map((book, i) => (
				<BookCard
					key={i}
					id={i}
					title={book.title}
					totalPages={book.totalPages}
				/>
			))}
		</div>
	);
}

export default HomePage;
