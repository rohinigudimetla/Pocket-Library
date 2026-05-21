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
		<div className="min-h-screen flex items-center justify-center p-inset-lg">
			{/* Outer peach card */}
			<div className="grain w-full max-w-auth-card bg-surface-sunken rounded-surface-lg p-space-lg shadow-card overflow-hidden">
				{/* Blob decoration — all positioning via inline style; inset-0 class is killed by --spacing:initial */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						backgroundImage: "url(/loginBg.png)",
						backgroundSize: "cover",
						backgroundPosition: "center",
						pointerEvents: "none",
					}}
				/>

				{/* Inner white card */}
				<div className="relative bg-surface rounded-surface pt-space-xl px-space-lg pb-space-lg shadow-card-soft flex flex-col">
					{/* Icon + heading — centered column */}
					<div className="flex flex-col items-center gap-gap-sm">
						<div className="w-icon-md h-icon-md rounded-icon bg-surface-page flex items-center justify-center flex-shrink-0">
							<svg
								width="26"
								height="26"
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

						<div className="flex flex-col items-center gap-gap-xxs">
							<h1 className="text-heading-h2 text-ink">Welcome back!</h1>
							<p className="text-button-sm text-ink-muted">
								Sign in to continue to PocketLibrary
							</p>
						</div>
					</div>

					{/* Form */}
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-gap-xs mt-gap-md"
					>
						{/* Email */}
						<div className="relative">
							<span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-ink-placeholder flex pointer-events-none">
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
								className="w-full text-button-md bg-surface border-[1.5px] border-border-warm text-ink placeholder:text-ink-placeholder rounded-control py-[12px] pl-[42px] pr-[14px] outline-none focus:border-border-strong focus:shadow-input-focus transition-[border-color,box-shadow]"
							/>
						</div>

						{/* Password */}
						<div className="relative">
							<span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-ink-placeholder flex pointer-events-none">
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
								className="w-full text-button-md bg-surface border-[1.5px] border-border-warm text-ink placeholder:text-ink-placeholder rounded-control py-[12px] pl-[42px] pr-[14px] outline-none focus:border-border-strong focus:shadow-input-focus transition-[border-color,box-shadow]"
							/>
						</div>

						{/* Error message or forgot password link */}
						<div className={`flex ${error ? "justify-start" : "justify-end"}`}>
							{error ? (
								<span className="text-button-sm font-semibold text-primary">
									{error}
								</span>
							) : (
								<span className="text-button-sm font-semibold text-primary cursor-pointer">
									Forgot password?
								</span>
							)}
						</div>

						<Button type="submit" variant="primary" size="md" className="w-full">
							Sign In
						</Button>
					</form>

					{/* Footer rows */}
					<p className="text-center text-button-sm text-ink-muted mt-gap-sm">
						Don't have an account?{" "}
						<span className="text-primary font-semibold">Contact admin.</span>
					</p>

					<div className="mt-gap-sm bg-surface-page rounded-control px-[14px] py-[10px] text-button-sm text-ink-muted leading-[1.7]">
						<strong className="text-ink">Demo credentials</strong>
						<br />
						Reader:{" "}
						<code className="bg-surface rounded-[4px] px-[5px] py-[1px]">
							r@p
						</code>{" "}
						/{" "}
						<code className="bg-surface rounded-[4px] px-[5px] py-[1px]">
							r
						</code>
						<br />
						Admin:{" "}
						<code className="bg-surface rounded-[4px] px-[5px] py-[1px]">
							a@p
						</code>{" "}
						/{" "}
						<code className="bg-surface rounded-[4px] px-[5px] py-[1px]">
							a
						</code>
					</div>
				</div>
			</div>
		</div>
	);
}

export default LoginPage;
