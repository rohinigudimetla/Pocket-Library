import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";

function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const { login } = useAuth();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const success = login(email, password);
		if (success) {
			navigate("/");
		} else {
			setError("Invalid credentials");
		}
	}

	return (
		<div
			className="min-h-screen w-full flex items-center justify-center p-inset-lg"
			style={{
				backgroundImage: "url(/loginBg.png)",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div className="w-full max-w-[420px] bg-surface rounded-surface-lg shadow-card p-inset-xl">
				{/* Logo */}
				<div className="flex flex-col items-center mb-inset-lg">
					<div className="w-inset-xl h-inset-xl rounded-surface bg-surface-sunken flex items-center justify-center mb-inset-md">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--color-primary)"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M3 5a2 2 0 0 1 2-2h5v17H5a2 2 0 0 1-2-2V5z" />
							<path d="M21 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 0 2-2V5z" />
						</svg>
					</div>
					<h1 className="text-heading-h1 text-ink">Welcome back!</h1>
					<p className="text-button-md text-ink-muted mt-inset-md">
						Sign in to continue to PocketLibrary
					</p>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-inset-md">
					{/* Email */}
					<div className="relative">
						<span className="absolute left-inset-md top-1/2 -translate-y-1/2 text-ink-muted">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="3" y="5" width="18" height="14" rx="2" />
								<path d="m3 7 9 6 9-6" />
							</svg>
						</span>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email"
							className="w-full h-button-md bg-surface border border-border text-ink text-button-md placeholder:text-ink-muted rounded-control pl-inset-xl pr-inset-md outline-none focus:border-border-strong transition"
						/>
					</div>

					{/* Password */}
					<div className="relative">
						<span className="absolute left-inset-md top-1/2 -translate-y-1/2 text-ink-muted">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="4" y="11" width="16" height="10" rx="2" />
								<path d="M8 11V7a4 4 0 0 1 8 0v4" />
							</svg>
						</span>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Password"
							className="w-full h-button-md bg-surface border border-border text-ink text-button-md placeholder:text-ink-muted rounded-control pl-inset-xl pr-inset-md outline-none focus:border-border-strong transition"
						/>
					</div>

					{error && (
						<p className="text-button-sm font-semibold text-primary">{error}</p>
					)}

					<Button
						type="submit"
						variant="primary"
						size="md"
						className="w-full mt-inset-md"
					>
						Sign In
					</Button>
				</form>

				<p className="text-center text-button-sm text-ink-muted mt-inset-lg">
					Don't have an account?{" "}
					<span className="text-primary font-semibold">Contact admin.</span>
				</p>
			</div>
		</div>
	);
}

export default LoginPage;
