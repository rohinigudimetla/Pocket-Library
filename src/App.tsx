import { useState } from "react";
import AddBook from "./components/AddBook";
import BookCard from "./components/BookCard";
import FeaturedBook from "./components/FeaturedBook";
import SearchBooks from "./components/SearchBooks";

function App() {
	const [books, setBooks] = useState([
		{ title: "The Great Gatsby", totalPages: 180 },
		{ title: "Dune", totalPages: 412 },
	]);
	// checking race condition
	const [showFeatured, setShowFeatured] = useState(true);

	function addBook(title: string) {
		setBooks([...books, { title, totalPages: 0 }]);
	}

	return (
		<div>
			<h1>PocketLibrary</h1>
			<FeaturedBook />
			<br />
			<SearchBooks />

			{/* <button onClick={() => setShowFeatured(false)}>
				Unmount FeaturedBook
			</button>
			{showFeatured && <FeaturedBook />} */}

			<AddBook onAdd={addBook} />
			{books.map((book, i) => (
				<BookCard key={i} title={book.title} totalPages={book.totalPages} />
			))}
		</div>
	);
}
export default App;
