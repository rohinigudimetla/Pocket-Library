import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";

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
		if (myRequests.length === 0) return <p>No requests yet.</p>;
		return (
			<div>
				<h2>My Requests</h2>
				{myRequests.map((r, i) => (
					<div key={i}>
						<span>{r.title}</span>
						{r.status === "pending" && (
							<button onClick={() => handleCancelRequest(r.title)}>
								Pending
							</button>
						)}
						{r.status === "cancelled" && (
							<button onClick={() => handleRequest(r.title, currentUser.name)}>
								Request
							</button>
						)}
						{r.status === "fulfilled" && <span> Fulfilled</span>}
					</div>
				))}
			</div>
		);
	}

	if (currentUser.role === "admin") {
		const pendingRequests = requests.filter((r) => r.status === "pending");
		if (pendingRequests.length === 0) return <p>No pending requests.</p>;
		return (
			<div>
				<h2>Pending Requests</h2>
				{pendingRequests.map((r, i) => (
					<div key={i}>
						<span>{r.title}</span>
						<span> — requested by {r.requestedBy}</span>
						<button onClick={() => handleAccept(r.title, r.requestedBy)}>
							Accept
						</button>
						<button onClick={() => handleDismiss(r.title, r.requestedBy)}>
							✕
						</button>
					</div>
				))}
			</div>
		);
	}
}
export default RequestList;
