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
			<InfoIcon
				className={cn(
					"size-3.5 shrink-0 cursor-help text-muted-foreground transition-colors hover:text-foreground",
					className,
				)}
			/>
		</TooltipWrapper>
	);
}
