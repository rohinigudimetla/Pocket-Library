import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";

function RequestList() {
	const { currentUser } = useAuth();
	const { requests, handleAccept, handleDismiss, handleCancelRequest, handleRequest } =
		useAppContext();

	if (!currentUser) return null;

	const isAdmin = currentUser.role === "admin";
	const visible = isAdmin
		? requests.filter((r) => r.status === "pending")
		: requests.filter((r) => r.requestedBy === currentUser.name);

	const statusBadge: Record<string, string> = {
		pending: "badge-pending",
		fulfilled: "badge-fulfilled",
		cancelled: "badge-cancelled",
		dismissed: "badge-cancelled",
	};

	return (
		<div className="bg-surface rounded-surface shadow-card p-inset-md flex flex-col">
			{/* Header */}
			<div className="flex items-center gap-gap-xs mb-gap-sm">
				<span className="text-heading-h2 text-ink">Requests</span>
				{visible.length > 0 && (
					<span className="badge-count">{visible.length}</span>
				)}
			</div>

			{visible.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center text-center gap-gap-xs py-inset-lg">
					<div className="w-button-md h-button-md rounded-control bg-surface-page flex items-center justify-center">
						<svg
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--color-primary)"
							strokeWidth="1.8"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
						</svg>
					</div>
					<p className="text-caption text-ink-muted">
						{isAdmin ? "No pending requests" : "No requests yet"}
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-gap-xs">
					{visible.slice(0, 4).map((r, i) => (
						<div
							key={i}
							className="bg-surface rounded-control shadow-sm p-inset-sm flex items-center gap-gap-sm"
						>
							{/* Mini cover */}
							<div
								className="rounded-cover bg-cover-bg flex-shrink-0 flex items-center justify-center"
								style={{
									width: "var(--cover-request-width)",
									height: "var(--cover-request-height)",
								}}
							>
								<svg
									width="16"
									height="16"
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
								<p className="text-button-md font-bold text-ink truncate">
									{r.title}
								</p>
								<p className="text-button-sm text-ink-muted mt-[2px]">
									{isAdmin ? `by ${r.requestedBy}` : `Status: ${r.status}`}
								</p>
							</div>

							{isAdmin && r.status === "pending" && (
								<div className="flex gap-gap-xxs flex-shrink-0">
									<button
										onClick={() => handleAccept(r.title, r.requestedBy)}
										className="w-button-sm h-button-sm rounded-pill bg-primary-strong border-[1.5px] border-primary-strong text-on-inverse flex items-center justify-center hover:bg-danger transition-colors"
									>
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.4"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<polyline points="20 6 9 17 4 12" />
										</svg>
									</button>
									<button
										onClick={() => handleDismiss(r.title, r.requestedBy)}
										className="w-button-sm h-button-sm rounded-pill border-[1.5px] border-[rgba(138,45,56,.25)] bg-surface text-danger flex items-center justify-center hover:bg-[rgba(138,45,56,.08)] transition-colors"
									>
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.4"
											strokeLinecap="round"
										>
											<line x1="5" y1="12" x2="19" y2="12" />
										</svg>
									</button>
								</div>
							)}

							{!isAdmin && (
								<>
									{r.status === "pending" && (
										<button
											onClick={() => handleCancelRequest(r.title)}
											className={`${statusBadge[r.status] ?? "badge-pending"} border-none cursor-pointer flex-shrink-0`}
										>
											{r.status}
										</button>
									)}
									{r.status !== "pending" && (
										<span className={`${statusBadge[r.status] ?? "badge-cancelled"} flex-shrink-0`}>
											{r.status}
										</span>
									)}
									{r.status === "cancelled" && (
										<button
											onClick={() => handleRequest(r.title, currentUser.name)}
											className="text-caption font-semibold text-primary ml-gap-xxs cursor-pointer border-none bg-transparent"
										>
											Re-request
										</button>
									)}
								</>
							)}
						</div>
					))}
				</div>
			)}

			{visible.length > 4 && (
				<p className="text-caption font-semibold text-primary mt-gap-sm cursor-pointer">
					View all ({visible.length}) →
				</p>
			)}
		</div>
	);
}

export default RequestList;
