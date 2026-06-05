import type { Route } from "next";
import Link from "next/link";

type FooterColumnProps = {
	title: string;
	children: React.ReactNode;
};

export function FooterColumn({ title, children }: FooterColumnProps) {
	return (
		<div className="flex min-w-0 flex-col">
			<span className="font-medium">{title}</span>
			<ul className="mt-4 space-y-3">{children}</ul>
		</div>
	);
}

type FooterColumnLinkProps = {
	href: Route | string;
	external?: boolean;
	children: React.ReactNode;
	title?: string;
};

export function FooterColumnLink({ href, external, children, title }: FooterColumnLinkProps) {
	return (
		<li className="min-w-0">
			<Link
				href={href as Route}
				prefetch={false}
				target={external ? "_blank" : undefined}
				rel={external ? "noopener noreferrer" : undefined}
				title={title}
				className="block truncate text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
			>
				{children}
			</Link>
		</li>
	);
}
