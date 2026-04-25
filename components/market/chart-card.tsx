import type { ReactNode } from "react";

import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

type ChartCardProps = {
	title?: string;
	tooltip?: string;
	action?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
};

export function ChartCard({ title, tooltip, action, children, footer, className }: ChartCardProps) {
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
						<div className="flex items-center gap-1.5">
							<h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
							{tooltip ? (
								<InfoTooltip
									content={tooltip}
									className="group-data-[share-mode=image]/share-card:hidden"
								/>
							) : null}
						</div>
					) : null}
					{action}
				</div>
			) : null}
			{children}
			{footer}
		</section>
	);
}
