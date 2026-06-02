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
			? `https://openlibrary.org/search.json?q=${debouncedQuery}&limit=6`
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
			className="bg-surface rounded-surface shadow-card flex flex-col overflow-hidden"
		>
			{/* Search input */}
			<div className="p-inset-sm">
				<div className="relative">
					<span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-ink-placeholder flex pointer-events-none">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="11" cy="11" r="8" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
					</span>
					<input
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setIsOpen(true);
						}}
						placeholder="Search books by title, author…"
						className="w-full text-button-md bg-surface-page border-[1.5px] border-border-warm text-ink placeholder:text-ink-placeholder rounded-control py-[12px] pl-[42px] pr-[44px] outline-none focus:border-border-strong focus:shadow-input-focus transition-[border-color,box-shadow]"
					/>
					<span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-primary flex pointer-events-none">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="4" y1="6" x2="20" y2="6" />
							<line x1="8" y1="12" x2="20" y2="12" />
							<line x1="12" y1="18" x2="20" y2="18" />
						</svg>
					</span>
				</div>
			</div>

			{/* Results */}
			{isOpen && (isLoading || error || (data?.docs?.length ?? 0) > 0) && (
				<div className="flex flex-col px-gap-xxs pb-gap-xxs">
					{isLoading && (
						<p className="text-caption text-ink-muted px-inset-sm py-gap-xs">
							Searching…
						</p>
					)}
					{error && (
						<p className="text-caption text-ink-muted px-inset-sm py-gap-xs">
							{error}
						</p>
					)}
					{data?.docs?.map((book: { title: string; author_name?: string[] }, i: number) => {
						const title = book.title;
						const author = book.author_name?.[0] ?? "Unknown author";
						const status = getRequestStatus(title);
						return (
							<div
								key={i}
								className="flex items-center gap-gap-sm px-inset-sm py-[10px] rounded-control transition-colors hover:bg-surface-page cursor-pointer"
							>
								{/* Mini cover */}
								<div
									className="rounded-cover bg-cover-bg flex-shrink-0 flex items-center justify-center"
									style={{ width: 36, height: 48 }}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="rgba(255,255,255,.35)"
										strokeWidth="1.5"
									>
										<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
										<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
									</svg>
								</div>

								<div className="flex-1 min-w-0">
									<p className="text-button-md font-semibold text-ink truncate">
										{title}
									</p>
									<p className="text-button-sm text-ink-muted">{author}</p>
								</div>

								{currentUser?.role === "reader" &&
									(status === "pending" ? (
										<button
											onClick={() => handleCancelRequest(title)}
											className="badge-pending flex-shrink-0 cursor-pointer border-none"
										>
											Pending
										</button>
									) : (
										<button
											onClick={() =>
												handleRequest(title, currentUser.name)
											}
											className="text-caption font-medium text-primary-strong bg-surface-page border-[1.5px] border-border-warm rounded-pill px-[10px] py-[4px] flex-shrink-0 cursor-pointer hover:bg-surface-warm transition-colors"
										>
											Request
										</button>
									))}

								{currentUser?.role === "admin" && (
									<button
										onClick={() => {
											addBook(title, 0);
											setIsOpen(false);
										}}
										className="w-button-sm h-button-sm rounded-pill border-[1.5px] border-border-warm bg-surface flex items-center justify-center text-primary-strong flex-shrink-0 hover:bg-surface-page transition-colors"
									>
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.2"
											strokeLinecap="round"
										>
											<line x1="12" y1="5" x2="12" y2="19" />
											<line x1="5" y1="12" x2="19" y2="12" />
										</svg>
									</button>
								)}
							</div>
						);
					})}
					{!isLoading && (data?.docs?.length ?? 0) > 0 && (
						<p className="text-caption font-semibold text-primary px-inset-sm py-gap-xxs cursor-pointer">
							View all results →
						</p>
					)}
				</div>
			)}
		</div>
	);
}

export default SearchBooks;
