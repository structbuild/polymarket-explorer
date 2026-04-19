import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChartCardProps = {
	title?: string;
	action?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
};

export function ChartCard({ title, action, children, footer, className }: ChartCardProps) {
	const hasHeader = title != null || action != null;
	return (
		<section
			className={cn(
				"bg-card rounded-lg p-4 sm:p-6",
				"group-data-[share-mode=image]/share-card:grid group-data-[share-mode=image]/share-card:h-full group-data-[share-mode=image]/share-card:grid-rows-[auto_minmax(0,1fr)_auto]",
				className,
			)}
		>
			{hasHeader ? (
				<div className="mb-4 flex items-center justify-between gap-3">
					{title != null ? (
						<h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
					) : null}
					{action}
				</div>
			) : null}
			{children}
			{footer}
		</section>
	);
}
