import { useState, useRef, useEffect } from "react";
import useDebounce from "../hooks/useDebounce";
import useFetch from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";
import Button from "./Button";

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
		<div ref={containerRef} className="relative w-full">
			<div className="relative">
				<span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-ink-placeholder flex pointer-events-none">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
				</span>
				<input
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setIsOpen(true);
					}}
					placeholder="Search books…"
					className="w-full text-button-md bg-surface border-[1.5px] border-border-warm text-ink placeholder:text-ink-placeholder rounded-control py-[12px] pl-[42px] pr-inset-md outline-none focus:border-border-strong focus:shadow-input-focus transition-[border-color,box-shadow]"
				/>
			</div>

			{isOpen && (isLoading || error || data?.docs?.length > 0) && (
				<div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-surface rounded-surface shadow-card border border-border max-h-[300px] overflow-y-auto z-50">
					{isLoading && (
						<p className="px-inset-md py-[12px] text-button-sm text-ink-muted">
							Searching…
						</p>
					)}
					{error && (
						<p className="px-inset-md py-[12px] text-button-sm text-primary">
							{error}
						</p>
					)}
					{data?.docs?.map((book: any, i: number) => (
						<div
							key={i}
							className="flex items-center justify-between px-inset-md py-[10px] border-b border-border last:border-0 gap-inline-sm"
						>
							<span className="text-button-md text-ink flex-1 min-w-0 truncate">
								{book.title}
							</span>
							{currentUser?.role === "reader" &&
								(() => {
									const status = getRequestStatus(book.title);
									return status === "pending" ? (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleCancelRequest(book.title)}
										>
											Pending
										</Button>
									) : (
										<Button
											variant="secondary"
											size="sm"
											onClick={() =>
												handleRequest(book.title, currentUser.name)
											}
										>
											Request
										</Button>
									);
								})()}
							{currentUser?.role === "admin" && (
								<Button
									variant="primary"
									size="sm"
									onClick={() => {
										addBook(book.title, 0);
										setIsOpen(false);
									}}
								>
									Add
								</Button>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default SearchBooks;
