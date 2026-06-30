import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";

function RequestList() {
	const { currentUser } = useAuth();
	const { requests, handleAccept, handleDismiss } = useAppContext();

	if (!currentUser) return null;

	const isAdmin = currentUser.role === "admin";

	return (
		<div className="bg-surface rounded-surface shadow-card p-inset-md flex flex-col">
			{/* Header */}
			<div className="flex items-center gap-gap-xs mb-gap-sm">
				<span className="text-heading-h2 text-ink">Requests</span>
				{requests.length > 0 && (
					<span className="badge-count">{requests.length}</span>
				)}
			</div>

			{requests.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center text-center gap-gap-xs py-inset-lg">
					<div className="w-button-md h-button-md rounded-control bg-surface-page flex items-center justify-center">
						{/* Inbox icon */}
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
							<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
							<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
						</svg>
					</div>
					<p className="text-caption text-ink-muted">
						{isAdmin ? "No pending requests" : "No requests yet"}
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-gap-xs">
					{requests.slice(0, 4).map((r) => (
						<div
							key={r.id}
							className="bg-surface rounded-control shadow-sm p-inset-sm flex items-center gap-gap-sm"
						>
							{/* Mini cover */}
							<div
								className="rounded-cover bg-cover-bg flex-shrink-0 flex items-center justify-center overflow-hidden"
								style={{
									width: "var(--cover-request-width)",
									height: "var(--cover-request-height)",
								}}
							>
								{r.coverId ? (
									<img
										src={`https://covers.openlibrary.org/b/id/${r.coverId}-S.jpg`}
										alt={r.title}
										className="w-full h-full object-cover"
									/>
								) : (
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
								)}
							</div>

							{/* Text */}
							<div className="flex-1 min-w-0">
								<p className="text-button-md font-bold text-ink truncate">
									{r.title}
								</p>
								<p className="text-button-sm text-ink-muted mt-[2px]">
									{isAdmin
										? `by ${r.requestedByUsername}`
										: `Status: ${r.status}`}
								</p>
							</div>

							{/* Action — fixed width to prevent layout shift */}
							<div className="flex-shrink-0 flex justify-end items-center min-w-action-col">
								{isAdmin && r.status === "PENDING" && (
									<div className="flex gap-gap-xxs">
										<button
											onClick={() => handleAccept(r.id)}
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
											onClick={() => handleDismiss(r.id)}
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

								{!isAdmin && r.status === "PENDING" && (
									<span className="badge-pending">Pending</span>
								)}
								{!isAdmin && r.status === "ACCEPTED" && (
									<span className="badge-fulfilled">Accepted</span>
								)}
								{!isAdmin && r.status === "DISMISSED" && (
									<span className="badge-cancelled">Dismissed</span>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{requests.length > 4 && (
				<p className="text-caption font-semibold text-primary mt-gap-sm cursor-pointer">
					View all ({requests.length}) →
				</p>
			)}
		</div>
	);
}

export default RequestList;
