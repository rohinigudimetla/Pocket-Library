import { createContext, useContext, useState, useEffect } from "react";
import type { Book, Request } from "../types";
import { useAuth } from "./AuthContext";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
type PageResponse<T> = {
	content: T[];
};

type AppContextType = {
	books: Book[];
	requests: Request[];
	notification: string | null;
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
	updateBookProgress: (id: number, pagesRead: number) => void;
	updateTotalPages: (id: number, totalPages: number) => void;
};

const AppContext = createContext<AppContextType>({
	books: [],
	requests: [],
	notification: null,
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
	const [notification, setNotification] = useState<string | null>(null);
	const { token, currentUser } = useAuth();

	useEffect(() => {
		if (!token) return;

		fetch(`${API_URL}/api/books`, {
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
				? `${API_URL}/api/requests/pending`
				: `${API_URL}/api/requests/mine`;

		fetch(endpoint, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => res.json())
			.then((data: PageResponse<Request>) => setRequests(data.content))
			.catch((err) => console.error("Failed to fetch requests:", err));
	}, [token, currentUser]);

	useEffect(() => {
		if (!token || !currentUser) return;
		const eventSource = new EventSource(
			`${API_URL}/api/requests/notifications/stream?token=${token}`,
		);
		eventSource.onmessage = (event) => {
			setNotification(event.data);
			setTimeout(() => setNotification(null), 4000);
		};
		return () => {
			eventSource.close();
		};
	}, [token, currentUser]);

	async function addBook(
		title: string,
		author: string,
		pageCount: number,
		coverId: string | null,
	) {
		const response = await fetch(`${API_URL}/api/books`, {
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

	async function updateBookProgress(id: number, pagesRead: number) {
		const response = await fetch(`${API_URL}/api/books/${id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ pagesRead }),
		});

		if (!response.ok) {
			console.error("Failed to update book progress");
			return;
		}

		const updatedBook = await response.json();
		setBooks((prev) => prev.map((b) => (b.id === id ? updatedBook : b)));
	}

	async function updateTotalPages(id: number, totalPages: number) {
		const response = await fetch(`${API_URL}/api/books/${id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ totalPages }),
		});

		if (!response.ok) {
			console.error("Failed to update total pages");
			return;
		}

		const updatedBook = await response.json();
		setBooks((prev) => prev.map((b) => (b.id === id ? updatedBook : b)));
	}

	async function handleRequest(
		title: string,
		author: string,
		coverId: string | null,
		totalPages: number,
	) {
		const response = await fetch(`${API_URL}/api/requests`, {
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
		const response = await fetch(`${API_URL}/api/requests/${id}/accept`, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			console.error("Failed to accept request");
			return;
		}

		setRequests((prev) => prev.filter((r) => r.id !== id));

		fetch(`${API_URL}/api/books`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => res.json())
			.then((data: PageResponse<Book>) => setBooks(data.content))
			.catch((err) => console.error("Failed to refresh books:", err));
	}

	async function handleDismiss(id: number) {
		const response = await fetch(`${API_URL}/api/requests/${id}/dismiss`, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			console.error("Failed to dismiss request");
			return;
		}

		setRequests((prev) => prev.filter((r) => r.id !== id));
	}

	async function handleDelete(id: number) {
		const response = await fetch(`${API_URL}/api/books/${id}`, {
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
				notification,
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
