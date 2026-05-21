import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
	const { currentUser, logout } = useAuth();

	return (
		<aside
			className="grain w-sidebar-width flex-shrink-0 flex flex-col py-inset-lg px-inset-md overflow-hidden"
			style={{ background: "linear-gradient(180deg, #7B1835 0%, #641B2E 100%)" }}
		>
			{/* Background blob */}
			<img
				src="/singleBlob.svg"
				className="absolute opacity-30 pointer-events-none"
				style={{ bottom: -64, left: -64, width: 280 }}
				alt=""
			/>

			{/* Logo row */}
			<div className="relative flex items-center gap-inline-sm pb-inset-lg">
				<div className="w-nav-icon h-nav-icon rounded-control bg-primary flex items-center justify-center flex-shrink-0">
					<svg
						width="20"
						height="20"
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
				<span className="text-on-inverse font-bold text-button-lg tracking-tight">
					Pocket Library
				</span>
			</div>

			{/* Nav */}
			<nav className="relative flex flex-col gap-gap-xxs">
				<NavLink
					to="/"
					end
					className={({ isActive }) =>
						`flex items-center gap-inline-sm px-inset-md py-inset-sm rounded-nav font-medium text-button-md transition-colors ${
							isActive
								? "bg-primary-strong text-on-inverse"
								: "text-on-inverse-muted hover:bg-surface-inverse-hover"
						}`
					}
				>
					<svg
						width="19"
						height="19"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
						<polyline points="9 22 9 12 15 12 15 22" />
					</svg>
					<span>Home</span>
				</NavLink>
				<NavLink
					to="/requests"
					className={({ isActive }) =>
						`flex items-center gap-inline-sm px-inset-md py-inset-sm rounded-nav font-medium text-button-md transition-colors ${
							isActive
								? "bg-primary-strong text-on-inverse"
								: "text-on-inverse-muted hover:bg-surface-inverse-hover"
						}`
					}
				>
					<svg
						width="19"
						height="19"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
					</svg>
					<span>Requests</span>
				</NavLink>
			</nav>

			<div className="flex-1" />

			{/* User info */}
			<div className="relative">
				<div className="flex items-center gap-inline-sm pt-space-sm px-gap-xxs pb-gap-xs">
					<div className="w-nav-icon h-nav-icon rounded-full bg-surface-avatar text-on-inverse flex items-center justify-center font-bold text-button-lg flex-shrink-0">
						{currentUser?.name?.charAt(0) ?? "U"}
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-on-inverse text-button-md font-semibold truncate">
							{currentUser?.name}
						</p>
						<p className="text-on-inverse-faint text-button-sm capitalize">
							{currentUser?.role}
						</p>
					</div>
				</div>
				<button
					onClick={logout}
					className="w-full flex items-center justify-center gap-inline-sm py-inset-sm px-inset-md rounded-control bg-primary text-on-inverse text-button-md font-semibold shadow-cta-side transition-colors hover:bg-primary-hover"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
						<polyline points="16 17 21 12 16 7" />
						<line x1="21" y1="12" x2="9" y2="12" />
					</svg>
					Logout
				</button>
			</div>
		</aside>
	);
}

export default Sidebar;
