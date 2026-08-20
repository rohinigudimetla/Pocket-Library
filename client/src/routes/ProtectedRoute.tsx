import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { currentUser, isLoading } = useAuth();
	if (isLoading) return null;
	if (!currentUser) return <Navigate to="/login" />;
	return children;
}

export default ProtectedRoute;
