import type { ReactNode } from "react";

import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

type ChartCardProps = {
	title?: ReactNode;
	tooltip?: string;
	action?: ReactNode;
	header?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
};

export function ChartCard({ title, tooltip, action, header, children, footer, className }: ChartCardProps) {
	const hasHeader = header != null || title != null || action != null;
	return (
		<section
			className={cn(
				"bg-card rounded-lg p-4 sm:p-6",
				"group-data-[share-mode=image]/share-card:grid group-data-[share-mode=image]/share-card:h-full group-data-[share-mode=image]/share-card:grid-rows-[auto_minmax(0,1fr)_auto]",
				className,
			)}
		>
			{hasHeader ? (
				header != null ? (
					<div className="mb-4">{header}</div>
				) : (
					<div className="mb-4 flex items-center justify-between gap-3">
						{title != null ? (
							<div className="flex min-w-0 items-center gap-1.5">
								<h2 className="truncate text-sm font-medium text-muted-foreground">{title}</h2>
								{tooltip ? (
									<InfoTooltip
										content={tooltip}
										className="shrink-0 group-data-[share-mode=image]/share-card:hidden"
									/>
								) : null}
							</div>
						) : null}
						{action ? <div className="flex shrink-0 items-center">{action}</div> : null}
					</div>
				)
			) : null}
			{children}
			{footer}
		</section>
	);
}
