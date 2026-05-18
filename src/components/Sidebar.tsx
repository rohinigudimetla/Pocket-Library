import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
	const { currentUser, logout } = useAuth();

	return (
		<aside
			className="fixed left-0 top-0 h-screen w-[240px] flex flex-col justify-between py-8 px-6 overflow-hidden"
			style={{
				background: "linear-gradient(180deg, #7B1835 0%, #641B2E 100%)",
			}}
		>
			{/* Background blob */}
			<img
				src="/singleBlob.svg"
				className="absolute -bottom-16 -left-16 w-[280px] opacity-30 pointer-events-none"
			/>

			{/* Top: logo + nav */}
			<div className="relative z-10">
				<div className="flex items-center gap-3 mb-10">
					<div className="w-9 h-9 rounded-xl bg-peach flex items-center justify-center">
						<span className="text-amaranth font-bold text-sm">PL</span>
					</div>
					<span className="text-white font-bold text-lg">PocketLibrary</span>
				</div>

				<nav className="flex flex-col gap-2">
					<NavLink
						to="/"
						className={({ isActive }) =>
							`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all ${isActive ? "bg-peach text-amaranth" : "text-white/70 hover:text-white hover:bg-white/10"}`
						}
					>
						Home
					</NavLink>
					<NavLink
						to="/requests"
						className={({ isActive }) =>
							`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all ${isActive ? "bg-peach text-amaranth" : "text-white/70 hover:text-white hover:bg-white/10"}`
						}
					>
						Requests
					</NavLink>
				</nav>
			</div>

			{/* Bottom: user info + logout */}
			<div className="relative z-10">
				<div className="flex items-center gap-3 mb-4 px-2">
					<div className="w-9 h-9 rounded-full bg-peach/20 flex items-center justify-center">
						<span className="text-peach text-sm font-semibold">
							{currentUser?.name?.charAt(0)}
						</span>
					</div>
					<div>
						<p className="text-white text-sm font-medium">
							{currentUser?.name}
						</p>
						<p className="text-white/50 text-xs capitalize">
							{currentUser?.role}
						</p>
					</div>
				</div>
				<button
					onClick={logout}
					className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
				>
					Logout
				</button>
			</div>
		</aside>
	);
}

export default Sidebar;
