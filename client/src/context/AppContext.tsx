import { createContext, useContext, useState } from "react";
import type { Book, Request } from "../types";

type AppContextType = {
	books: Book[];
	requests: Request[];
	addBook: (title: string, pageCount: number) => void;
	handleRequest: (title: string, requestedBy: string) => void;
	handleAccept: (title: string, requestedBy: string) => void;
	handleDismiss: (title: string, requestedBy: string) => void;
	handleCancelRequest: (title: string) => void;
	handleDelete: (title: string) => void;
	updateBookProgress: (title: string, pagesRead: number) => void;
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
});

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [books, setBooks] = useState<Book[]>([
		{ title: "The Great Gatsby", totalPages: 180, pagesRead: 0 },
		{ title: "Dune", totalPages: 412, pagesRead: 0 },
	]);
	const [requests, setRequests] = useState<Request[]>([]);

	function addBook(title: string, pageCount: number) {
		setBooks((prev) => [...prev, { title, totalPages: pageCount, pagesRead: 0 }]);
	}

	function updateBookProgress(title: string, pagesRead: number) {
		setBooks((prev) =>
			prev.map((b) => (b.title === title ? { ...b, pagesRead } : b)),
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
		setBooks((prev) => [...prev, { title, totalPages: 0, pagesRead: 0 }]);
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
