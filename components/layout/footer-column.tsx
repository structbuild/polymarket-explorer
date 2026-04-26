import Link from "next/link";
import type { Route } from "next";

type FooterColumnProps = {
	title: string;
	viewAllHref?: Route;
	viewAllLabel?: string;
	children: React.ReactNode;
};

export function FooterColumn({ title, viewAllHref, viewAllLabel = "View all", children }: FooterColumnProps) {
	return (
		<div className="flex min-w-0 flex-col">
			<span className="font-medium">{title}</span>
			<ul className="mt-4 space-y-3">{children}</ul>
			{viewAllHref && (
				<Link
					href={viewAllHref}
					prefetch={false}
					className="mt-4 text-sm text-muted-foreground/80 transition-colors duration-150 hover:text-primary"
				>
					{viewAllLabel} →
				</Link>
			)}
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

export function FooterColumnFallback({ title, rowCount = 5 }: { title: string; rowCount?: number }) {
	return (
		<div className="flex min-w-0 flex-col">
			<span className="font-medium">{title}</span>
			<ul className="mt-4 space-y-3">
				{Array.from({ length: rowCount }, (_, i) => (
					<li key={i} className="h-4 w-3/4 animate-pulse rounded bg-muted/60" />
				))}
			</ul>
		</div>
	);
}
