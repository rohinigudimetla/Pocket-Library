import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	ref?: Ref<HTMLButtonElement>;
	variant?: Variant;
	size?: Size;
	icon?: ReactNode;
}

const baseClass = [
	"inline-flex items-center justify-center",
	"font-sans font-semibold leading-none",
	"cursor-pointer select-none",
	"transition-colors transition-transform",
	"active:translate-y-px",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
	"disabled:cursor-not-allowed disabled:active:translate-y-0",
].join(" ");

const variantClass: Record<Variant, string> = {
	primary: [
		"rounded-pill bg-primary text-on-inverse shadow-cta",
		"hover:bg-primary-strong",
		"disabled:bg-surface-sunken disabled:text-ink-muted disabled:shadow-none disabled:hover:bg-surface-sunken",
	].join(" "),
	secondary: [
		"rounded-pill bg-surface text-primary ring-1 ring-primary",
		"hover:bg-surface-hover",
		"disabled:bg-surface-sunken disabled:text-ink-muted disabled:ring-0 disabled:hover:bg-surface-sunken",
	].join(" "),
	ghost: [
		"rounded-pill bg-transparent text-ink ring-1 ring-border",
		"hover:bg-surface-hover",
		"disabled:text-ink-muted disabled:hover:bg-transparent",
	].join(" "),
	danger: [
		"rounded-pill bg-danger text-on-inverse shadow-cta",
		"hover:bg-danger-strong",
		"disabled:bg-surface-sunken disabled:text-ink-muted disabled:shadow-none disabled:hover:bg-surface-sunken",
	].join(" "),
	icon: [
		"rounded-control bg-surface text-ink ring-1 ring-border",
		"hover:bg-surface-hover",
		"disabled:text-ink-muted disabled:hover:bg-surface",
	].join(" "),
};

const labelSize: Record<Size, string> = {
	sm: "h-button-sm px-inset-md text-button-sm gap-inline-xs",
	md: "h-button-md px-inset-lg text-button-md gap-inline-xs",
	lg: "h-button-lg px-inset-xl text-button-lg gap-inline-xs",
};

const iconSize: Record<Size, string> = {
	sm: "h-button-sm w-button-sm text-button-sm",
	md: "h-button-md w-button-md text-button-md",
	lg: "h-button-lg w-button-lg text-button-lg",
};

function Button({
	ref,
	variant = "primary",
	size = "md",
	icon,
	children,
	className,
	...rest
}: ButtonProps) {
	const isIcon = variant === "icon";
	const cls = [
		baseClass,
		variantClass[variant],
		isIcon ? iconSize[size] : labelSize[size],
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button ref={ref} className={cls} {...rest}>
			{isIcon ? (
				icon
			) : (
				<>
					{icon}
					{children}
				</>
			)}
		</button>
	);
}

export default Button;
