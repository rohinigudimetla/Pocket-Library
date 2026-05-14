import { useState } from "react";
import useDebounce from "../hooks/useDebounce";
import useFetch from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";

function SearchBooks() {
	const [query, setQuery] = useState("");
	const { currentUser } = useAuth();
	const { handleRequest, addBook } = useAppContext();
	const debouncedQuery = useDebounce(query, 500);
	const searchUrl =
		debouncedQuery.length >= 3
			? `https://openlibrary.org/search.json?q=${debouncedQuery}`
			: "";
	const { data, isLoading, error } = useFetch(searchUrl);

	return (
		<div>
			<input
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Search books..."
			/>
			{isLoading && <p>Searching...</p>}
			{error && <p>{error}</p>}
			{data?.docs?.map((book: any, i: number) => (
				<div key={i}>
					<p>{book.title}</p>
					{currentUser?.role === "reader" && (
						<button onClick={() => handleRequest(book.title, currentUser.name)}>
							Request
						</button>
					)}
					{currentUser?.role === "admin" && (
						<button onClick={() => addBook(book.title, 0)}>
							Add to Library
						</button>
					)}
				</div>
			))}
		</div>
	);
}

export default SearchBooks;
