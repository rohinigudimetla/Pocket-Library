import { Link } from "react-router-dom";
import useCounter from "../hooks/useCounter";
import useToggle from "../hooks/useToggle";
import type { Book } from "../types";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";
import Button from "./Button";

interface BookCardProps extends Book {
	id: number;
}

function BookCard({ title, totalPages, id }: BookCardProps) {
	const { value: isRead, toggle: toggleRead } = useToggle(false);
	const { count, increment, decrement, reset, setTo } = useCounter(0);
	const { currentUser } = useAuth();
	const { handleDelete } = useAppContext();

	return (
		<div className="noise relative bg-surface rounded-surface shadow-card p-inset-lg flex flex-col gap-[14px] overflow-hidden">
			<div>
				<Link to={`/books/${id}`} className="group">
					<h3 className="text-heading-h2 text-ink group-hover:text-primary transition-colors leading-tight">
						{title}
					</h3>
				</Link>
				<span
					className={`text-button-sm font-semibold mt-[4px] inline-block ${isRead ? "text-primary" : "text-ink-muted"}`}
				>
					{isRead ? "Read ✓" : "Unread"}
				</span>
			</div>

			<div className="flex flex-col gap-[8px]">
				<p className="text-button-sm text-ink-muted">
					Page{" "}
					<span className="text-ink font-semibold">{count}</span> /{" "}
					<span className="text-ink font-semibold">{totalPages}</span>
				</p>
				<input
					type="number"
					value={count}
					onChange={(e) => setTo(Number(e.target.value))}
					min={0}
					max={totalPages}
					className="w-full text-button-md bg-surface border-[1.5px] border-border-warm text-ink rounded-control py-[10px] px-inset-md outline-none focus:border-border-strong focus:shadow-input-focus transition-[border-color,box-shadow]"
				/>
				<div className="flex gap-inline-xs">
					<Button
						variant="secondary"
						size="sm"
						onClick={increment}
						className="flex-1"
					>
						+
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={decrement}
						className="flex-1"
					>
						−
					</Button>
					<Button variant="ghost" size="sm" onClick={reset}>
						Reset
					</Button>
				</div>
			</div>

			<div className="flex flex-col gap-inline-xs">
				<Button
					variant="ghost"
					size="sm"
					onClick={toggleRead}
					className="w-full"
				>
					{isRead ? "Mark Unread" : "Mark Read"}
				</Button>
				{currentUser?.role === "admin" && (
					<Button
						variant="danger"
						size="sm"
						onClick={() => handleDelete(title)}
						className="w-full"
					>
						Delete
					</Button>
				)}
			</div>
		</div>
	);
}

export default BookCard;
