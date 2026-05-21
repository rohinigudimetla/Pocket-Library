import { useState, useRef, useEffect } from "react";
import useDebounce from "../hooks/useDebounce";
import useFetch from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";

function SearchBooks() {
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const { currentUser } = useAuth();
	const { handleRequest, addBook, requests, handleCancelRequest } =
		useAppContext();
	const debouncedQuery = useDebounce(query, 500);
	const searchUrl =
		debouncedQuery.length >= 3
			? `https://openlibrary.org/search.json?q=${debouncedQuery}`
			: "";
	const { data, isLoading, error } = useFetch(searchUrl);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	function getRequestStatus(title: string) {
		if (!currentUser) return null;
		const existing = requests.find(
			(r) => r.title === title && r.requestedBy === currentUser.name,
		);
		return existing?.status ?? null;
	}

	return (
		<div
			ref={containerRef}
			style={{ position: "relative", display: "inline-block", width: "300px" }}
		>
			<input
				value={query}
				onChange={(e) => {
					setQuery(e.target.value);
					setIsOpen(true);
				}}
				placeholder="Search books..."
				style={{ width: "100%" }}
			/>
			{isOpen && (isLoading || error || data?.docs?.length > 0) && (
				<div
					style={{
						position: "absolute",
						top: "100%",
						left: 0,
						right: 0,
						background: "white",
						border: "1px solid #ccc",
						borderRadius: "4px",
						maxHeight: "300px",
						overflowY: "auto",
						zIndex: 1000,
					}}
				>
					{isLoading && <p style={{ padding: "8px" }}>Searching...</p>}
					{error && <p style={{ padding: "8px" }}>{error}</p>}
					{data?.docs?.map((book: any, i: number) => (
						<div
							key={i}
							style={{
								padding: "8px",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								borderBottom: "1px solid #eee",
							}}
						>
							<span>{book.title}</span>
							{currentUser?.role === "reader" &&
								(() => {
									const status = getRequestStatus(book.title);
									return status === "pending" ? (
										<button onClick={() => handleCancelRequest(book.title)}>
											Pending
										</button>
									) : (
										<button
											onClick={() =>
												handleRequest(book.title, currentUser.name)
											}
										>
											Request
										</button>
									);
								})()}
							{currentUser?.role === "admin" && (
								<button
									onClick={() => {
										addBook(book.title, 0);
										setIsOpen(false);
									}}
								>
									Add to Library
								</button>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default SearchBooks;
