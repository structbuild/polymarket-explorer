"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	TRADER_TIMEFRAMES,
	TRADER_TIMEFRAME_LABELS,
	type TraderTimeframe,
} from "@/lib/trader-timeframes";
import { cn } from "@/lib/utils";

type TradersTimeframeToggleProps = {
	timeframe: TraderTimeframe;
	className?: string;
};

export function TradersTimeframeToggle({
	timeframe,
	className,
}: TradersTimeframeToggleProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	return (
		<ToggleGroup
			aria-label="Leaderboard timeframe"
			value={[timeframe]}
			onValueChange={(next) => {
				const picked = next[0];

				if (!picked || picked === timeframe) {
					return;
				}

				const params = new URLSearchParams(searchParams.toString());
				params.set("timeframe", picked);
				params.delete("cursor");

				startTransition(() => {
					router.push(`${pathname}?${params.toString()}` as Route);
				});
			}}
			variant="outline"
			size="sm"
			className={cn("w-full justify-start sm:w-fit", className)}
		>
			{TRADER_TIMEFRAMES.map((choice) => (
				<ToggleGroupItem
					key={choice}
					value={choice}
					aria-label={TRADER_TIMEFRAME_LABELS[choice]}
					disabled={isPending}
				>
					{TRADER_TIMEFRAME_LABELS[choice]}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
