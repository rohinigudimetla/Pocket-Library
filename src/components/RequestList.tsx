import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";
import Button from "./Button";

function RequestList() {
	const { currentUser } = useAuth();
	const {
		requests,
		handleAccept,
		handleDismiss,
		handleCancelRequest,
		handleRequest,
	} = useAppContext();

	if (!currentUser) return null;

	if (currentUser.role === "reader") {
		const myRequests = requests.filter(
			(r) => r.requestedBy === currentUser.name,
		);
		if (myRequests.length === 0)
			return (
				<p className="text-button-md text-ink-muted">No requests yet.</p>
			);
		return (
			<div className="flex flex-col gap-[12px]">
				<h2 className="text-heading-h2 text-ink">My Requests</h2>
				{myRequests.map((r, i) => (
					<div
						key={i}
						className="bg-surface rounded-surface shadow-card-soft px-inset-lg py-[14px] flex items-center justify-between gap-inline-sm"
					>
						<span className="text-button-md text-ink font-medium">
							{r.title}
						</span>
						{r.status === "pending" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleCancelRequest(r.title)}
							>
								Pending
							</Button>
						)}
						{r.status === "cancelled" && (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => handleRequest(r.title, currentUser.name)}
							>
								Request
							</Button>
						)}
						{r.status === "fulfilled" && (
							<span className="text-button-sm font-semibold text-primary">
								Fulfilled ✓
							</span>
						)}
					</div>
				))}
			</div>
		);
	}

	if (currentUser.role === "admin") {
		const pendingRequests = requests.filter((r) => r.status === "pending");
		if (pendingRequests.length === 0)
			return (
				<p className="text-button-md text-ink-muted">No pending requests.</p>
			);
		return (
			<div className="flex flex-col gap-[12px]">
				<h2 className="text-heading-h2 text-ink">Pending Requests</h2>
				{pendingRequests.map((r, i) => (
					<div
						key={i}
						className="bg-surface rounded-surface shadow-card-soft px-inset-lg py-[14px] flex items-center justify-between gap-inline-sm"
					>
						<div className="flex flex-col gap-[2px]">
							<span className="text-button-md text-ink font-medium">
								{r.title}
							</span>
							<span className="text-button-sm text-ink-muted">
								Requested by {r.requestedBy}
							</span>
						</div>
						<div className="flex items-center gap-inline-xs">
							<Button
								variant="primary"
								size="sm"
								onClick={() => handleAccept(r.title, r.requestedBy)}
							>
								Accept
							</Button>
							<Button
								variant="icon"
								size="sm"
								onClick={() => handleDismiss(r.title, r.requestedBy)}
							>
								✕
							</Button>
						</div>
					</div>
				))}
			</div>
		);
	}
}

export default RequestList;
