import { StructLogo } from "@/components/ui/svgs/struct-logo";
import { cn } from "@/lib/utils";

export function ChartWatermark({ className }: { className?: string }) {
	return (
		<StructLogo
			aria-hidden
			className={cn(
				"pointer-events-none absolute left-1/2 top-1/2 h-10 -translate-x-1/2 -translate-y-1/2 text-foreground opacity-[0.06] sm:h-12",
				"group-data-[share-mode=image]/share-card:hidden",
				className,
			)}
		/>
	);
}
