import RequestList from "../components/RequestList";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

function RequestsPage() {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div className="flex min-h-screen md:h-screen md:overflow-hidden bg-surface-page text-ink font-sans">
			<Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

			<div className="flex-1 min-w-0 flex flex-col md:overflow-y-auto">
				<header
					className="md:hidden flex items-center justify-between px-inset-md py-inset-sm sticky top-0 z-30"
					style={{
						background: "linear-gradient(180deg, #7B1835 0%, #641B2E 100%)",
					}}
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
						<h1 className="text-heading-h1 text-ink">Requests</h1>
						<RequestList />
					</div>
				</main>
			</div>
		</div>
	);
}

export default RequestsPage;
