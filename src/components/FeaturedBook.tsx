import useFetch from "../hooks/useFetch";

function FeaturedBook() {
	const { data, isLoading, error } = useFetch(
		"https://openlibrary.org/works/OL45804W.json",
	);

	return (
		<div className="noise relative bg-surface-inverse rounded-surface-lg shadow-card p-inset-xl overflow-hidden">
			{/* Background decoration */}
			<img
				src="/redBlobs.svg"
				className="absolute right-0 top-0 h-full w-auto opacity-20 pointer-events-none"
				aria-hidden="true"
			/>

			<div className="relative z-10">
				<p className="text-button-sm font-semibold text-accent uppercase tracking-widest mb-[10px]">
					Featured
				</p>

				{isLoading && (
					<p className="text-heading-h2 text-on-inverse/50">Loading…</p>
				)}
				{error && <p className="text-button-md text-accent">{error}</p>}
				{data && (
					<>
						<h3 className="text-heading-h1 text-on-inverse">{data.title}</h3>
						<p className="text-button-md text-on-inverse/60 mt-[8px]">
							Author info requires second fetch
						</p>
					</>
				)}
			</div>
		</div>
	);
}

export default FeaturedBook;
