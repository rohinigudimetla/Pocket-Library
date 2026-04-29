import useCounter from "../hooks/useCounter";
import useToggle from "../hooks/useToggle";

interface BookCardProps {
	title: string;
	totalPages: number;
}
function BookCard({ title, totalPages }: BookCardProps) {
	const { value: isRead, toggle: toggleRead } = useToggle(false);
	const { count, increment, decrement, reset, setTo } = useCounter(0);
	return (
		<div>
			<h3>{title}</h3>
			<p>Status: {isRead ? "Read✓" : "Unread"}</p>
			<button onClick={toggleRead}>
				{isRead ? "Mark Unread" : "Mark Read"}
			</button>
			<p>
				Current: {count} / {totalPages}
			</p>
			<input
				type="number"
				value={count}
				onChange={(e) => setTo(Number(e.target.value))}
				min={0}
				max={totalPages}
			/>
			<button onClick={increment}>+</button>
			<button onClick={decrement}>-</button>
			<button onClick={reset}>Reset page</button>
		</div>
	);
}

export default BookCard;
