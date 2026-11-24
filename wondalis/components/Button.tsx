import Link from "next/link";

type Variant = "primary" | "gold" | "secondary" | "outline-light";

const styles: Record<Variant, string> = {
  primary: "bg-forest-900 text-ivory hover:bg-forest-700",
  gold: "bg-gold-500 text-forest-900 hover:bg-gold-300",
  secondary:
    "border-[1.5px] border-forest-900 text-forest-900 hover:bg-forest-900 hover:text-ivory",
  "outline-light":
    "border-[1.5px] border-ivory bg-forest-900/45 text-ivory hover:bg-forest-900/70",
};

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-full px-7 py-4 text-[15px] font-semibold leading-5 tracking-[0.2px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
} & (
  | { href: string; type?: never }
  | { href?: undefined; type?: "button" | "submit" }
);

export function Button({
  children,
  variant = "primary",
  className = "",
  href,
  type = "button",
  onClick,
  disabled,
}: Props) {
  const cls = `${base} ${styles[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      className={`${cls} disabled:pointer-events-none disabled:opacity-60`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
