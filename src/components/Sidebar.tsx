import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
	const { currentUser, logout } = useAuth();

	return (
		<aside
			className="noise fixed left-0 top-0 h-screen w-[var(--sidebar-width)] flex flex-col justify-between py-[32px] px-inset-lg overflow-hidden"
			style={{
				background:
					"linear-gradient(180deg, var(--raw-amaranth-600) 0%, var(--raw-amaranth-500) 100%)",
			}}
		>
			{/* Background blob */}
			<img
				src="/singleBlob.svg"
				className="absolute -bottom-[64px] -left-[64px] w-[280px] opacity-30 pointer-events-none"
				aria-hidden="true"
			/>

			{/* Top: logo + nav */}
			<div className="relative z-10">
				<div className="flex items-center gap-inline-sm mb-inset-xl">
					<div className="w-[36px] h-[36px] rounded-control bg-accent flex items-center justify-center flex-shrink-0">
						<span className="text-on-accent font-bold text-button-md">PL</span>
					</div>
					<span className="text-on-inverse font-bold text-button-lg">
						PocketLibrary
					</span>
				</div>

				<nav className="flex flex-col gap-inline-xs">
					<NavLink
						to="/"
						className={({ isActive }) =>
							`flex items-center gap-inline-sm px-inset-md py-[12px] rounded-pill text-button-md font-medium transition-all ${isActive ? "bg-accent text-on-accent font-semibold" : "text-on-inverse/70 hover:text-on-inverse hover:bg-on-inverse/10"}`
						}
					>
						Home
					</NavLink>
					<NavLink
						to="/requests"
						className={({ isActive }) =>
							`flex items-center gap-inline-sm px-inset-md py-[12px] rounded-pill text-button-md font-medium transition-all ${isActive ? "bg-accent text-on-accent font-semibold" : "text-on-inverse/70 hover:text-on-inverse hover:bg-on-inverse/10"}`
						}
					>
						Requests
					</NavLink>
				</nav>
			</div>

			{/* Bottom: user info + logout */}
			<div className="relative z-10">
				<div className="flex items-center gap-inline-sm mb-inset-md px-[8px]">
					<div className="w-[36px] h-[36px] rounded-pill bg-on-inverse/10 flex items-center justify-center flex-shrink-0">
						<span className="text-accent text-button-md font-semibold">
							{currentUser?.name?.charAt(0)}
						</span>
					</div>
					<div>
						<p className="text-on-inverse text-button-md font-medium">
							{currentUser?.name}
						</p>
						<p className="text-on-inverse/50 text-[12px] capitalize">
							{currentUser?.role}
						</p>
					</div>
				</div>
				<button
					onClick={logout}
					className="w-full flex items-center gap-inline-sm px-inset-md py-[12px] rounded-pill text-button-md font-medium text-on-inverse/70 hover:text-on-inverse hover:bg-on-inverse/10 transition-all"
				>
					Logout
				</button>
			</div>
		</aside>
	);
}

export default Sidebar;
