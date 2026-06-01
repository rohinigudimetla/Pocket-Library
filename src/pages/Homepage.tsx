import { useState } from "react";
import FeaturedBook from "../components/FeaturedBook";
import SearchBooks from "../components/SearchBooks";
import AddBookForm from "../forms/AddBookForm";
import BookCard from "../components/BookCard";
import RequestList from "../components/RequestList";
import Sidebar from "../components/Sidebar";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

function YourLibraryCard({ count }: { count: number }) {
	return (
		<div className="bg-surface rounded-surface shadow-card p-inset-lg flex flex-col items-center justify-center gap-gap-sm text-center">
			<div className="w-icon-md h-icon-md rounded-control bg-surface-page flex items-center justify-center">
				<svg
					width="26"
					height="26"
					viewBox="0 0 24 24"
					fill="none"
					stroke="var(--color-primary)"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
					<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
				</svg>
			</div>
			<div>
				<p className="text-button-lg font-bold text-ink">Your Library</p>
				<p className="text-caption text-ink-muted mt-gap-xxs">
					{count} {count === 1 ? "book" : "books"} in your collection
				</p>
			</div>
		</div>
	);
}

function AddNewCard({ onClick }: { onClick: () => void }) {
	return (
		<div
			onClick={onClick}
			className="rounded-surface border-[1.5px] border-border-dashed flex flex-col items-center justify-center gap-gap-sm text-primary cursor-pointer transition-colors hover:bg-surface-hover"
			style={{ minHeight: 340 }}
		>
			<div className="w-icon-md h-icon-md rounded-full bg-surface-page flex items-center justify-center">
				<svg
					width="26"
					height="26"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</div>
			<p className="text-button-md font-semibold text-center">
				Add
				<br />
				New Book
			</p>
		</div>
	);
}

function HomePage() {
	const { books, addBook } = useAppContext();
	const { currentUser } = useAuth();
	const isAdmin = currentUser?.role === "admin";
	const [mobileOpen, setMobileOpen] = useState(false);

	const hour = new Date().getHours();
	const greeting =
		hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

	return (
		<div className="flex min-h-screen md:h-screen md:overflow-hidden bg-surface-page text-ink font-sans">
			<Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

			<div className="flex-1 min-w-0 flex flex-col md:overflow-y-auto">
				{/* Mobile top header */}
				<header
					className="md:hidden flex items-center justify-between px-inset-md py-inset-sm sticky top-0 z-30"
					style={{ background: "linear-gradient(180deg, #7B1835 0%, #641B2E 100%)" }}
				>
					<div className="flex items-center gap-inline-sm">
						<div className="w-[32px] h-[32px] rounded-control bg-primary flex items-center justify-center flex-shrink-0">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--color-accent-soft)"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M3 5a2 2 0 0 1 2-2h5v17H5a2 2 0 0 1-2-2V5z" />
								<path d="M21 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 0 2-2V5z" />
							</svg>
						</div>
						<span className="text-on-inverse font-bold text-button-md tracking-tight">
							Pocket Library
						</span>
					</div>
					<button
						onClick={() => setMobileOpen(true)}
						className="text-on-inverse p-[6px] rounded-control hover:bg-surface-inverse-hover transition-colors"
						aria-label="Open menu"
					>
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						>
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</button>
				</header>

				<main className="flex-1 overflow-y-auto">
					<div className="p-inset-md md:p-inset-lg flex flex-col gap-gap-md">
						{/* Greeting row */}
						<div className="flex items-center justify-between flex-wrap gap-gap-xs">
							<div>
								<h1 className="text-heading-h1 text-ink">
									{greeting}, {currentUser?.name}{" "}
									<span style={{ fontSize: 26 }}>👋</span>
								</h1>
								<p className="text-button-md text-ink-muted mt-gap-xxs">
									Pick up where you left off.
								</p>
							</div>
						</div>

						{/* Featured book */}
						<FeaturedBook />

						{/* 3-column middle row */}
						<div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr] gap-gap-md">
							<SearchBooks />
							<RequestList />
							{isAdmin ? (
								<AddBookForm onAdd={addBook} />
							) : (
								<YourLibraryCard count={books.length} />
							)}
						</div>

						{/* Books section header */}
						<div className="flex items-center gap-gap-xs mt-gap-xs">
							<h2 className="text-heading-h2 text-ink">Your Books</h2>
							<span className="badge-count">{books.length}</span>
						</div>

						{/* Books grid */}
						{books.length === 0 ? (
							<div className="bg-surface rounded-surface shadow-card p-inset-xl flex flex-col items-center gap-gap-sm text-center">
								<div className="w-icon-md h-icon-md rounded-control bg-surface-page flex items-center justify-center">
									<svg
										width="26"
										height="26"
										viewBox="0 0 24 24"
										fill="none"
										stroke="var(--color-primary)"
										strokeWidth="1.8"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
										<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
									</svg>
								</div>
								<p className="text-button-lg font-bold text-ink">No books yet</p>
								<p className="text-caption text-ink-muted">
									Add your first book to get started.
								</p>
							</div>
						) : (
							<div
								className="grid gap-gap-md pb-inset-xl"
								style={{
									gridTemplateColumns: `repeat(auto-fill, minmax(var(--book-grid-min), 1fr))`,
								}}
							>
								{books.map((book, i) => (
									<BookCard
										key={i}
										id={i}
										title={book.title}
										totalPages={book.totalPages}
										pagesRead={book.pagesRead}
									/>
								))}
								{isAdmin && <AddNewCard onClick={() => {}} />}
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
}

export default HomePage;
