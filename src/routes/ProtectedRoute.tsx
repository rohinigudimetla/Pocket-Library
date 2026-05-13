import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// const isLoggedIn = true;
// why usenavigate there and why navigate here
function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { currentUser } = useAuth();
	if (!currentUser) return <Navigate to="/login" />;
	return children;
}

export default ProtectedRoute;
