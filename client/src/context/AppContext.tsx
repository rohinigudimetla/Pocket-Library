import { createContext, useContext, useState, useEffect } from "react";
import type { Book, Request } from "../types";

type AppContextType = {
	books: Book[];
	requests: Request[];
	addBook: (
		title: string,
		author: string,
		pageCount: number,
		coverId: string | null,
	) => void;
	handleRequest: (title: string, requestedBy: string) => void;
	handleAccept: (title: string, requestedBy: string) => void;
	handleDismiss: (title: string, requestedBy: string) => void;
	handleCancelRequest: (title: string) => void;
	handleDelete: (title: string) => void;
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

	useEffect(() => {
		fetch("http://localhost:8080/api/books")
			.then((res) => res.json())
			.then((data) => setBooks(data))
			.catch((err) => console.error("Failed to fetch books:", err));
	}, []);

	function addBook(
		title: string,
		author: string,
		pageCount: number,
		coverId: string | null,
	) {
		setBooks((prev) => [
			...prev,
			{
				id: Date.now(),
				title,
				author,
				totalPages: pageCount,
				pagesRead: 0,
				coverId,
			},
		]);
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

	function handleRequest(title: string, requestedBy: string) {
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
			return [...prev, { title, status: "pending", requestedBy }];
		});
	}

	function handleAccept(title: string, requestedBy: string) {
		setBooks((prev) => [
			...prev,
			{
				id: Date.now(),
				title,
				author: "Unknown",
				totalPages: 0,
				pagesRead: 0,
				coverId: null,
			},
		]);
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

	function handleDelete(title: string) {
		setBooks((prev) => prev.filter((b) => b.title !== title));
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
