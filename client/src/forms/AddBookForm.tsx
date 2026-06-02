import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
	title: z.string().min(3, "Title must be at least 3 characters"),
	pageCount: z.number().positive("Page count must be a positive number"),
});

type FormData = z.infer<typeof schema>;

function AddBookForm({ onAdd }: { onAdd: (title: string, pageCount: number) => void }) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormData>({ resolver: zodResolver(schema) });

	function onSubmit(data: FormData) {
		onAdd(data.title, data.pageCount);
		reset();
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="bg-surface-sunken rounded-surface p-inset-lg shadow-sm"
		>
			{/* Header */}
			<div className="flex items-center gap-inline-sm mb-gap-md">
				<div className="w-nav-icon h-nav-icon rounded-control bg-accent-soft flex items-center justify-center flex-shrink-0">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="var(--color-primary-strong)"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
						<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
					</svg>
				</div>
				<div>
					<p className="text-button-lg font-bold text-ink">Add New Book</p>
					<p className="text-caption text-ink-muted">Keep your library growing.</p>
				</div>
			</div>

			<div className="flex flex-col gap-gap-xs">
				{/* Title */}
				<div>
					<label className="block text-caption font-semibold text-ink-muted mb-gap-xxs">
						Book Title
					</label>
					<input
						type="text"
						{...register("title")}
						placeholder="e.g. The Midnight Library"
						className="w-full text-button-md bg-surface border-[1.5px] border-[#F3D7A2] text-ink placeholder:text-ink-placeholder rounded-control py-[12px] px-[14px] outline-none focus:border-border-strong focus:shadow-input-focus transition-[border-color,box-shadow]"
					/>
					{errors.title && (
						<p className="text-button-sm text-primary font-semibold mt-gap-xxs">
							{errors.title.message}
						</p>
					)}
				</div>

				{/* Page count */}
				<div>
					<label className="block text-caption font-semibold text-ink-muted mb-gap-xxs">
						Total Pages
					</label>
					<input
						type="number"
						min={0}
						{...register("pageCount", { valueAsNumber: true })}
						placeholder="e.g. 304"
						className="w-full text-button-md bg-surface border-[1.5px] border-[#F3D7A2] text-ink placeholder:text-ink-placeholder rounded-control py-[12px] px-[14px] outline-none focus:border-border-strong focus:shadow-input-focus transition-[border-color,box-shadow]"
					/>
					{errors.pageCount && (
						<p className="text-button-sm text-primary font-semibold mt-gap-xxs">
							{errors.pageCount.message}
						</p>
					)}
				</div>
			</div>

			<button
				type="submit"
				className="w-full mt-gap-md flex items-center justify-center gap-inline-xs py-[14px] px-[22px] rounded-pill bg-primary text-on-inverse text-button-md font-semibold shadow-cta hover:bg-primary-hover transition-colors"
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.2"
					strokeLinecap="round"
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				Add Book
			</button>
		</form>
	);
}

export default AddBookForm;
