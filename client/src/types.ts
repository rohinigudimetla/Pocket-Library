export type Request = {
	id: number;
	title: string;
	author: string;
	coverId: string | null;
	totalPages: number;
	status: "PENDING" | "ACCEPTED" | "DISMISSED";
	requestedByUsername: string;
};

export type User = { name: string; role: "reader" | "admin" };

export type Book = {
	id: number;
	title: string;
	author: string;
	totalPages: number;
	pagesRead: number;
	coverId: string | null;
};
