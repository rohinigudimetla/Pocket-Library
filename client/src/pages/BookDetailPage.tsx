import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";

function BookDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { books } = useAppContext();
	const book = books[Number(id)];
	const [mobileOpen, setMobileOpen] = useState(false);

	const pct =
		book && book.totalPages > 0
			? Math.round((book.pagesRead / book.totalPages) * 100)
			: 0;

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
						{/* Back button */}
						<div>
							<Button variant="ghost" size="sm" onClick={() => navigate("/")}>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polyline points="15 18 9 12 15 6" />
								</svg>
								Back to Home
							</Button>
						</div>

						{!book ? (
							<div className="bg-surface rounded-surface shadow-card p-inset-xl flex flex-col items-center gap-gap-sm text-center">
								<p className="text-button-lg font-bold text-ink">Book not found</p>
								<p className="text-caption text-ink-muted">
									This book doesn't exist in your library.
								</p>
							</div>
						) : (
							<div className="bg-surface rounded-surface shadow-card p-inset-lg flex flex-col sm:flex-row gap-gap-md">
								{/* Book cover */}
								<div
									className="flex-shrink-0 self-center sm:self-start rounded-cover bg-cover-bg shadow-book flex items-center justify-center"
									style={{
										width: "var(--cover-sm-width)",
										height: "var(--cover-sm-height)",
									}}
								>
									<svg
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="rgba(255,255,255,.3)"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
										<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
									</svg>
								</div>

								{/* Book meta */}
								<div className="flex flex-col gap-gap-sm flex-1 min-w-0">
									<div>
										<h2 className="text-heading-h2 text-ink">{book.title}</h2>
										<p className="text-caption text-ink-muted mt-gap-xxs">
											Total pages: {book.totalPages}
										</p>
									</div>

									{/* Progress */}
									<div>
										<div className="flex justify-between items-center text-caption text-ink-muted mb-gap-xxs">
											<span>{book.pagesRead} / {book.totalPages} pages read</span>
											<span className="font-bold text-primary">{pct}%</span>
										</div>
										<div className="progress progress--light">
											<span style={{ width: `${pct}%` }} />
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
}

export default BookDetailPage;
