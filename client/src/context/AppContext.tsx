import { createContext, useContext, useState, useEffect } from "react";
import type { Book, Request } from "../types";
import { useAuth } from "./AuthContext";

type PageResponse<T> = {
	content: T[];
};

type AppContextType = {
	books: Book[];
	requests: Request[];
	addBook: (
		title: string,
		author: string,
		pageCount: number,
		coverId: string | null,
	) => void;
	handleRequest: (
		title: string,
		author: string,
		coverId: string | null,
		totalPages: number,
	) => void;
	handleAccept: (id: number) => void;
	handleDismiss: (id: number) => void;
	handleDelete: (id: number) => void;
	updateBookProgress: (title: string, pagesRead: number) => void;
	updateTotalPages: (title: string, totalPages: number) => void;
};

const AppContext = createContext<AppContextType>({
	books: [],
	requests: [],
	addBook: () => {},
	handleRequest: () => {},
	handleAccept: () => {},
	handleDismiss: () => {},
	handleDelete: () => {},
	updateBookProgress: () => {},
	updateTotalPages: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [books, setBooks] = useState<Book[]>([]);
	const [requests, setRequests] = useState<Request[]>([]);
	const { token, currentUser } = useAuth();

	useEffect(() => {
		if (!token) return;

		fetch("http://localhost:8080/api/books", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => res.json())
			.then((data: PageResponse<Book>) => setBooks(data.content))
			.catch((err) => console.error("Failed to fetch books:", err));
	}, [token]);

	useEffect(() => {
		if (!token || !currentUser) return;

		const endpoint =
			currentUser.role === "admin"
				? "http://localhost:8080/api/requests/pending"
				: "http://localhost:8080/api/requests/mine";

		fetch(endpoint, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => res.json())
			.then((data: PageResponse<Request>) => setRequests(data.content))
			.catch((err) => console.error("Failed to fetch requests:", err));
	}, [token, currentUser]);

	async function addBook(
		title: string,
		author: string,
		pageCount: number,
		coverId: string | null,
	) {
		const response = await fetch("http://localhost:8080/api/books", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				title,
				author,
				totalPages: pageCount,
				pagesRead: 0,
				coverId,
			}),
		});

		if (!response.ok) {
			console.error("Failed to add book");
			return;
		}

		const savedBook = await response.json();
		setBooks((prev) => [...prev, savedBook]);
	}

	function updateBookProgress(title: string, pagesRead: number) {
		setBooks((prev) =>
			prev.map((b) => (b.title === title ? { ...b, pagesRead } : b)),
		);
	}

	function updateTotalPages(title: string, totalPages: number) {
		setBooks((prev) =>
			prev.map((b) => (b.title === title ? { ...b, totalPages } : b)),
		);
	}

	async function handleRequest(
		title: string,
		author: string,
		coverId: string | null,
		totalPages: number,
	) {
		const response = await fetch("http://localhost:8080/api/requests", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ title, author, coverId, totalPages }),
		});

		if (!response.ok) {
			console.error("Failed to create request");
			return;
		}

		const savedRequest = await response.json();
		setRequests((prev) => [...prev, savedRequest]);
	}

	async function handleAccept(id: number) {
		const response = await fetch(
			`http://localhost:8080/api/requests/${id}/accept`,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		);

		if (!response.ok) {
			console.error("Failed to accept request");
			return;
		}

		setRequests((prev) => prev.filter((r) => r.id !== id));

		fetch("http://localhost:8080/api/books", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => res.json())
			.then((data: PageResponse<Book>) => setBooks(data.content))
			.catch((err) => console.error("Failed to refresh books:", err));
	}

	async function handleDismiss(id: number) {
		const response = await fetch(
			`http://localhost:8080/api/requests/${id}/dismiss`,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		);

		if (!response.ok) {
			console.error("Failed to dismiss request");
			return;
		}

		setRequests((prev) => prev.filter((r) => r.id !== id));
	}

	async function handleDelete(id: number) {
		const response = await fetch(`http://localhost:8080/api/books/${id}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			console.error("Failed to delete book");
			return;
		}

		setBooks((prev) => prev.filter((b) => b.id !== id));
	}

	return (
		<AppContext.Provider
			value={{
				books,
				requests,
				addBook,
				handleRequest,
				handleAccept,
				handleDismiss,
				handleDelete,
				updateBookProgress,
				updateTotalPages,
			}}
		>
			{children}
		</AppContext.Provider>
	);
}

export function useAppContext() {
	return useContext(AppContext);
}

export default AppContext;
