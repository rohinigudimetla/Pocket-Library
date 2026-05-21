import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../components/Button";

const schema = z.object({
	title: z.string().min(3, "Title must be at least 3 characters"),
	pageCount: z.number().positive("Page count must be a positive number"),
});

type FormData = z.infer<typeof schema>;

function AddBookForm({
	onAdd,
}: {
	onAdd: (title: string, pageCount: number) => void;
}) {
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
		<div className="bg-surface-sunken rounded-surface p-inset-lg">
			<h2 className="text-heading-h2 text-ink mb-inset-md">Add a Book</h2>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col gap-[12px]"
			>
				<div className="flex flex-col gap-[6px]">
					<label className="text-button-sm font-semibold text-ink-muted">
						Book Title
					</label>
					<input
						type="text"
						{...register("title")}
						placeholder="Enter book title"
						className="w-full text-button-md bg-surface border-[1.5px] border-border-warm text-ink placeholder:text-ink-placeholder rounded-control py-[12px] px-inset-md outline-none focus:border-border-strong focus:shadow-input-focus transition-[border-color,box-shadow]"
					/>
					{errors.title && (
						<p className="text-button-sm text-primary font-semibold">
							{errors.title.message}
						</p>
					)}
				</div>

				<div className="flex flex-col gap-[6px]">
					<label className="text-button-sm font-semibold text-ink-muted">
						Page Count
					</label>
					<input
						type="number"
						min={0}
						{...register("pageCount", { valueAsNumber: true })}
						placeholder="Enter page count"
						className="w-full text-button-md bg-surface border-[1.5px] border-border-warm text-ink placeholder:text-ink-placeholder rounded-control py-[12px] px-inset-md outline-none focus:border-border-strong focus:shadow-input-focus transition-[border-color,box-shadow]"
					/>
					{errors.pageCount && (
						<p className="text-button-sm text-primary font-semibold">
							{errors.pageCount.message}
						</p>
					)}
				</div>

				<div className="flex gap-inline-xs pt-[4px]">
					<Button type="submit" variant="primary" size="md" className="flex-1">
						Add Book
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="md"
						onClick={() => reset()}
					>
						Reset
					</Button>
				</div>
			</form>
		</div>
	);
}

export default AddBookForm;
