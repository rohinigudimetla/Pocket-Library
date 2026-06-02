import { Link } from "react-router-dom";

function NotFoundPage() {
	return (
		<div>
			<h2>404 - Page not found</h2>
			<Link to="/">Go back home</Link>
		</div>
	);
}

export default NotFoundPage;
