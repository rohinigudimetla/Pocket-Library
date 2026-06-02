export type Request = {
	title: string;
	status: "pending" | "cancelled" | "fulfilled" | "dismissed";
	requestedBy: string;
};

export type User = { name: string; role: "reader" | "admin" };

export type Book = { title: string; totalPages: number; pagesRead: number };
