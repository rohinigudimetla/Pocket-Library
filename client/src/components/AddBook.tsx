import useInput from "../hooks/useInput";

interface AddBookProps {
	onAdd: (title: string) => void;
}

function AddBook({ onAdd }: AddBookProps) {
	const { value, onChange } = useInput("");

	return (
		<div>
			<input {...{ value, onChange }} placeholder="Book title" />
			<button
				onClick={() => {
					onAdd(value);
				}}
			>
				Add Book
			</button>
		</div>
	);
}

export default AddBook;
