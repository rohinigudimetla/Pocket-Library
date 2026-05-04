import { useState } from "react";
import FeaturedBook from "../components/FeaturedBook";
import SearchBooks from "../components/SearchBooks";
import AddBook from "../components/AddBook";
import BookCard from "../components/BookCard";

interface HomePageProps {
	books: { title: string; totalPages: number }[];
	onAdd: (title: string) => void;
}
function HomePage({ books, onAdd }: HomePageProps) {
	return (
		<div>
			<h1>PocketLibrary</h1>
			<FeaturedBook />
			<SearchBooks />
			<AddBook onAdd={onAdd} />
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
