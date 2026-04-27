import type { BuilderFeeRateHistoryEntry } from "@structbuild/sdk";

import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatDateShort } from "@/lib/format";

function bpsToPct(bps: number | null | undefined): string {
	if (bps == null) return "—";
	return `${(bps / 100).toFixed(2)}%`;
}

type BuilderFeeHistoryProps = {
	entries: BuilderFeeRateHistoryEntry[];
};

export function BuilderFeeHistory({ entries }: BuilderFeeHistoryProps) {
	if (entries.length === 0) {
		return null;
	}

	const sorted = [...entries].sort((a, b) => b.observed_at - a.observed_at);

	return (
		<Card variant="analytics">
			<CardContent className="space-y-3">
				<div className="flex items-center gap-1.5">
					<h3 className="text-sm font-medium text-muted-foreground">Fee history</h3>
					<InfoTooltip content="Maker / taker bps changes over time." />
				</div>

				<ol className="space-y-2 text-sm">
					{sorted.map((entry, idx) => (
						<li
							key={`${entry.observed_at}-${idx}`}
							className="grid grid-cols-[8rem_1fr_4rem] items-center gap-3 border-t border-border/50 pt-2 first:border-0 first:pt-0"
						>
							<span className="text-muted-foreground tabular-nums">
								{formatDateShort(entry.observed_at)}
							</span>
							<span className="tabular-nums">
								<span className="text-foreground">{bpsToPct(entry.builder_maker_fee_rate_bps)}</span>
								<span className="text-muted-foreground"> maker · </span>
								<span className="text-foreground">{bpsToPct(entry.builder_taker_fee_rate_bps)}</span>
								<span className="text-muted-foreground"> taker</span>
							</span>
							<span
								className={`text-right text-xs ${entry.enabled ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground"}`}
							>
								{entry.enabled ? "Current" : "Old fee"}
							</span>
						</li>
					))}
				</ol>
			</CardContent>
		</Card>
	);
}
