import { InfoIcon } from "lucide-react";

import { TooltipWrapper } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InfoTooltipProps = {
	content: string;
	className?: string;
};

export function InfoTooltip({ content, className }: InfoTooltipProps) {
	return (
		<TooltipWrapper content={content}>
			<button
				type="button"
				aria-label="More information"
				className={cn(
					"inline-flex items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					className,
				)}
			>
				<InfoIcon className="size-3.5 shrink-0 cursor-help text-muted-foreground transition-colors hover:text-foreground" />
			</button>
		</TooltipWrapper>
	);
}
