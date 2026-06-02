import type { ReactNode } from "react";

interface DashboardLayoutProps {
	sidebar: ReactNode;
	children: ReactNode;
}

function DashboardLayout({ sidebar, children }: DashboardLayoutProps) {
	return (
		<div className="min-h-screen flex bg-surface-page text-ink font-sans">
			{sidebar}
			<main className="flex-1 min-w-0">
				<div className="mx-auto max-w-[var(--layout-content-max)] p-inset-xl flex flex-col gap-gap-section">
					{children}
				</div>
			</main>
		</div>
	);
}

export default DashboardLayout;
