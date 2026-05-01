import { useState } from "react";
import useDebounce from "../hooks/useDebounce";
import useFetch from "../hooks/useFetch";

function SearchBooks() {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query, 500);
	const searchUrl = debouncedQuery
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
			{/* not sure if u remember but its my locked door analogy for left to right stuff */}
			{isLoading && <p>Searching...</p>}
			{error && <p>{error}</p>}
			{data?.docs?.map((book: any, i: number) => (
				<p key={i}>{book.title}</p>
			))}
		</div>
	);
}

export default SearchBooks;
