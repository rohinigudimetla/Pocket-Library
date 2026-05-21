import { Link } from "react-router-dom";
import useToggle from "../hooks/useToggle";
import type { Book } from "../types";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";

interface BookCardProps extends Book {
	id: number;
}

function BookCard({ title, totalPages, id, pagesRead }: BookCardProps) {
	const { value: isRead, toggle: toggleRead } = useToggle(false);
	const { currentUser } = useAuth();
	const { handleDelete, updateBookProgress } = useAppContext();

	const pct = totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;

	function increment() {
		updateBookProgress(title, Math.min(totalPages, pagesRead + 1));
	}
	function decrement() {
		updateBookProgress(title, Math.max(0, pagesRead - 1));
	}
	function reset() {
		updateBookProgress(title, 0);
	}

	return (
		<div className="bg-surface rounded-surface shadow-card p-inset-md flex flex-col gap-gap-xs">
			{/* Cover */}
			<Link to={`/books/${id}`} className="self-center">
				<div
					className="rounded-cover bg-cover-bg shadow-book flex items-center justify-center"
					style={{
						width: "var(--cover-sm-width)",
						height: "var(--cover-sm-height)",
					}}
				>
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="rgba(255,255,255,.25)"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
						<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
					</svg>
				</div>
			</Link>

			{/* Title */}
			<Link to={`/books/${id}`}>
				<p className="text-button-md font-bold text-ink mt-gap-xxs truncate">
					{title}
				</p>
			</Link>

			{/* Read toggle */}
			<div className="flex items-center justify-between">
				<span className="text-caption font-medium text-ink">Read</span>
				<label className="toggle toggle--sm">
					<input
						type="checkbox"
						checked={isRead}
						onChange={toggleRead}
						className="sr-only"
					/>
					<div className="toggle-track" />
					<div className="toggle-thumb" />
				</label>
			</div>

			{/* Progress */}
			<div className="flex justify-between items-center text-caption text-ink-muted">
				<span>
					{pagesRead} / {totalPages}
				</span>
				<span className="font-bold text-primary">{pct}%</span>
			</div>
			<div className="progress progress--light">
				<span style={{ width: `${pct}%` }} />
			</div>

			{/* Controls */}
			<div className="flex items-center gap-gap-xxs mt-gap-xxs">
				<button
					onClick={decrement}
					className="w-button-sm h-button-sm rounded-pill border-[1.5px] border-border-warm bg-surface flex items-center justify-center text-primary-strong hover:bg-surface-page transition-colors"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
					>
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
				</button>
				<button
					onClick={increment}
					className="w-button-sm h-button-sm rounded-pill border-[1.5px] border-border-warm bg-surface flex items-center justify-center text-primary-strong hover:bg-surface-page transition-colors"
				>
					<svg
						width="12"
						height="12"
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
				<button
					onClick={reset}
					title="Reset"
					className="w-button-sm h-button-sm rounded-pill border-[1.5px] border-border-warm bg-surface flex items-center justify-center text-ink-muted hover:bg-surface-page transition-colors"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="1 4 1 10 7 10" />
						<path d="M3.51 15a9 9 0 1 0 .49-3.5" />
					</svg>
				</button>
				{currentUser?.role === "admin" && (
					<button
						onClick={() => handleDelete(title)}
						className="w-button-sm h-button-sm rounded-pill border-[1.5px] border-[rgba(138,45,56,.25)] bg-surface flex items-center justify-center text-danger hover:bg-[rgba(138,45,56,.08)] transition-colors ml-auto"
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="3 6 5 6 21 6" />
							<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
							<path d="M10 11v6" />
							<path d="M14 11v6" />
							<path d="M9 6V4h6v2" />
						</svg>
					</button>
				)}
			</div>
		</div>
	);
}

export default BookCard;
