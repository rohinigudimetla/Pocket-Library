// Zod is a validation library. You describe what valid data looks like,
// and Zod tells you exactly what is wrong when data does not match.
import { z } from "zod";

// useForm is the main React Hook Form hook.
// It manages all field values, validation, and errors internally.
// You do not need useState for any form field.
import { useForm } from "react-hook-form";

// zodResolver is the bridge between React Hook Form and Zod.
// Without this, they cannot communicate.
import { zodResolver } from "@hookform/resolvers/zod";

// The schema defines what valid form data looks like.
// z.object means the data is an object with named fields.
// Each field has a type and an error message for when it fails validation.
const schema = z.object({
	// title must be a string with at least 3 characters.
	// The second argument to .min() is the error message shown to the user.
	title: z.string().min(3, "Title must be at least 3 characters"),

	// pageCount must be a number and must be positive.
	pageCount: z.number().positive("Page count must be a positive number"),
});

// z.infer extracts the TypeScript type from the schema automatically.
// This means FormData is { title: string, pageCount: number }
// without you having to write that interface manually.
// Zod and TypeScript stay in sync -- change the schema, the type updates too.
type FormData = z.infer<typeof schema>;

// onAdd is a function passed in from the parent component (HomePage).
// When the form is submitted successfully, it calls onAdd with the validated data.
function AddBookForm({
	onAdd,
}: {
	onAdd: (title: string, pageCount: number) => void;
}) {
	// useForm is configured with three things:
	// 1. <FormData> tells it the shape of the form data (from our Zod type)
	// 2. resolver: zodResolver(schema) connects our Zod schema for validation
	// register  -- connects an input to React Hook Form (replaces value + onChange)
	// handleSubmit -- wraps your submit function, runs validation first
	// reset -- clears all fields back to empty
	// errors -- contains all current validation error messages
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
	});

	function onSubmit(data: FormData) {
		onAdd(data.title, data.pageCount);
		reset();
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			{/* Title input */}
			<div>
				<label>Book Title</label>
				<input
					type="text"
					// register connects this input to React Hook Form.
					// "title" must match the field name in the schema exactly.
					{...register("title")}
					placeholder="Enter book title"
				/>
				{/* errors.title exists only when validation fails for this field.
                The message comes directly from the Zod schema. */}
				{errors.title && <p>{errors.title.message}</p>}
			</div>

			{/* Page count input */}
			<div>
				<label>Page Count</label>
				<input
					type="number"
					min={0}
					// valueAsNumber tells React Hook Form to treat the value
					// as a number, not a string. Without this, pageCount
					// arrives as a string and Zod's z.number() check fails.
					{...register("pageCount", { valueAsNumber: true })}
					placeholder="Enter page count"
				/>
				{errors.pageCount && <p>{errors.pageCount.message}</p>}
			</div>

			<button type="submit">Add Book</button>
			<button type="button" onClick={() => reset()}>
				Reset
			</button>
		</form>
	);
}

export default AddBookForm;
