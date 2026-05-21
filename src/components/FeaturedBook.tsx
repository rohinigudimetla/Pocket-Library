import { useAppContext } from "../context/AppContext";

function ProgressRing({ pct, size = 108 }: { pct: number; size?: number }) {
	const r = (size - 16) / 2;
	const circ = 2 * Math.PI * r;
	const offset = circ * (1 - pct / 100);
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={r}
				fill="none"
				stroke="rgba(255,255,255,.12)"
				strokeWidth="8"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={r}
				fill="none"
				stroke="var(--color-accent)"
				strokeWidth="8"
				strokeDasharray={circ}
				strokeDashoffset={offset}
				strokeLinecap="round"
				style={{ transition: "stroke-dashoffset 0.4s ease" }}
			/>
			<text
				x="50%"
				y="50%"
				textAnchor="middle"
				dy=".35em"
				fill="#fff"
				fontSize="20"
				fontWeight="700"
				style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
			>
				{pct}%
			</text>
		</svg>
	);
}

function FeaturedBook() {
	const { books } = useAppContext();
	const book = books[0] ?? null;

	if (!book) return null;

	const pct =
		book.totalPages > 0
			? Math.round((book.pagesRead / book.totalPages) * 100)
			: 0;

	return (
		<div
			className="grain relative overflow-hidden rounded-surface-lg p-space-lg flex items-center gap-gap-md shadow-hero"
			style={{
				background: "linear-gradient(135deg, #8A2D38 0%, #641B2E 100%)",
				color: "#fff",
			}}
		>
			{/* Background blobs */}
			<img
				src="/redBlobs.svg"
				className="absolute pointer-events-none opacity-40"
				style={{ inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
				alt=""
			/>

			{/* Book cover */}
			<div
				className="relative z-[1] flex-shrink-0 rounded-cover bg-cover-bg shadow-book -rotate-3 flex items-center justify-center"
				style={{
					width: "var(--cover-featured-width)",
					height: "var(--cover-featured-height)",
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

			{/* Meta */}
			<div className="flex-1 relative z-[1] min-w-0">
				<span className="badge-featured mb-gap-sm inline-flex">
					<svg
						width="11"
						height="11"
						viewBox="0 0 24 24"
						fill="var(--color-accent)"
						stroke="var(--color-accent)"
						strokeWidth="1.5"
					>
						<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
					</svg>
					Featured Book
				</span>
				<h2 className="text-heading-h2 text-on-inverse mb-gap-xxs truncate">
					{book.title}
				</h2>
				<p className="text-caption text-on-inverse-soft mb-gap-sm">
					{book.totalPages} pages
				</p>

				{/* Progress bar */}
				<div className="progress mb-gap-xxs">
					<span style={{ width: `${pct}%`, background: "var(--color-accent)" }} />
				</div>
				<p className="text-caption text-on-inverse-soft">
					{book.pagesRead} / {book.totalPages} pages read
				</p>
			</div>

			{/* Progress ring */}
			<div className="relative z-[1] self-center flex-shrink-0">
				<ProgressRing pct={pct} size={108} />
			</div>
		</div>
	);
}

export default FeaturedBook;
