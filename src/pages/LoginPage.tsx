import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const { login } = useAuth();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const success = login(email, password);
		//why not pass it with ({}).
		// just wondering. i never seem to know when
		// theres deconstruction and when there is not.

		if (success) {
			navigate("/");
		} else {
			setError("Invalid credentials");
		}
	}
	return (
		<div>
			<h1>PocketLibrary</h1>
			<form onSubmit={handleSubmit}>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="Email"
				/>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Password"
				/>
				{error && <p>{error}</p>}
				<button type="submit">Sign in</button>
			</form>
		</div>
	);
}

export default LoginPage;
