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

	const hour = new Date().getHours();
	const greeting =
		hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

	return (
		<div className="flex h-screen overflow-hidden bg-surface-page text-ink font-sans">
			<Sidebar />

			<main className="flex-1 min-w-0 overflow-y-auto">
				<div className="p-inset-lg flex flex-col gap-gap-md">
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
					<div className="grid grid-cols-[1.3fr_1fr_1fr] gap-gap-md">
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
	);
}

export default HomePage;
