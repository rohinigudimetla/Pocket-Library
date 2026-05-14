import { createContext, useContext, useState } from "react";
import type { Book, Request } from "../types";

type AppContextType = {
	books: Book[];
	requests: Request[];
	addBook: (title: string, pageCount: number) => void;
	handleRequest: (title: string, requestedBy: string) => void;
	handleAccept: (title: string) => void;
	handleDismiss: (title: string) => void;
	handleCancelRequest: (title: string) => void;
};

const AppContext = createContext<AppContextType>({
	books: [],
	requests: [],
	addBook: () => {},
	handleRequest: () => {},
	handleAccept: () => {},
	handleDismiss: () => {},
	handleCancelRequest: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [books, setBooks] = useState<Book[]>([
		{ title: "The Great Gatsby", totalPages: 180 },
		{ title: "Dune", totalPages: 412 },
	]);
	const [requests, setRequests] = useState<Request[]>([]);

	function addBook(title: string, pageCount: number) {
		setBooks((prev) => [...prev, { title, totalPages: pageCount }]);
	}

	function handleRequest(title: string, requestedBy: string) {
		setRequests((prev) => [...prev, { title, status: "pending", requestedBy }]);
	}

	function handleAccept(title: string) {
		setBooks((prev) => [...prev, { title, totalPages: 0 }]);
		setRequests((prev) =>
			prev.map((r) =>
				r.title === title ? { ...r, status: "fulfilled" as const } : r,
			),
		);
	}

	function handleDismiss(title: string) {
		setRequests((prev) =>
			prev.map((r) =>
				r.title === title ? { ...r, status: "dismissed" as const } : r,
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
