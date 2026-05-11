import { Navigate } from "react-router-dom";

const isLoggedIn = true;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	if (!isLoggedIn) return <Navigate to="/" />;
	return children;
}

export default ProtectedRoute;
