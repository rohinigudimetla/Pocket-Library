import { createContext, useContext, useState, useEffect } from "react";
import type { Book, Request } from "../types";
import { useAuth } from "./AuthContext";

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
		requestedBy: string,
	) => void;
	handleAccept: (title: string, requestedBy: string) => void;
	handleDismiss: (title: string, requestedBy: string) => void;
	handleCancelRequest: (title: string) => void;
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
	handleCancelRequest: () => {},
	handleDelete: () => {},
	updateBookProgress: () => {},
	updateTotalPages: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [books, setBooks] = useState<Book[]>([]);
	const [requests, setRequests] = useState<Request[]>([]);
	const { token } = useAuth();

	useEffect(() => {
		if (!token) return;

		fetch("http://localhost:8080/api/books", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => res.json())
			.then((data) => setBooks(data))
			.catch((err) => console.error("Failed to fetch books:", err));
	}, [token]);

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

	function handleRequest(
		title: string,
		author: string,
		coverId: string | null,
		totalPages: number,
		requestedBy: string,
	) {
		setRequests((prev) => {
			const existing = prev.find(
				(r) => r.title === title && r.requestedBy === requestedBy,
			);
			if (existing) {
				return prev.map((r) =>
					r.title === title && r.requestedBy === requestedBy
						? { ...r, status: "pending" as const }
						: r,
				);
			}
			return [
				...prev,
				{ title, author, coverId, totalPages, status: "pending", requestedBy },
			];
		});
	}

	async function handleAccept(title: string, requestedBy: string) {
		const request = requests.find(
			(r) => r.title === title && r.requestedBy === requestedBy,
		);
		if (!request) return;

		const response = await fetch("http://localhost:8080/api/books", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				title: request.title,
				author: request.author,
				totalPages: request.totalPages,
				pagesRead: 0,
				coverId: request.coverId,
			}),
		});

		if (!response.ok) {
			console.error("Failed to accept request");
			return;
		}

		const savedBook = await response.json();
		setBooks((prev) => [...prev, savedBook]);

		setRequests((prev) =>
			prev.map((r) =>
				r.title === title && r.requestedBy === requestedBy
					? { ...r, status: "fulfilled" as const }
					: r,
			),
		);
	}

	function handleDismiss(title: string, requestedBy: string) {
		setRequests((prev) =>
			prev.map((r) =>
				r.title === title && r.requestedBy === requestedBy
					? { ...r, status: "dismissed" as const }
					: r,
			),
		);
	}

	function handleCancelRequest(title: string) {
		setRequests((prev) =>
			prev.map((r) =>
				r.title === title ? { ...r, status: "cancelled" as const } : r,
			),
		);
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
				handleCancelRequest,
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
