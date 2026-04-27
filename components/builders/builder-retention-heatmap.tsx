import type { CohortRetentionRow } from "@structbuild/sdk";

import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatDateCompact, formatNumber } from "@/lib/format";

const OFFSET_KEYS: readonly string[] = ["1", "7", "30"];
const OFFSET_LABELS: Record<string, string> = {
	"1": "D1",
	"7": "D7",
	"30": "D30",
};

function cellTone(value: number | undefined): string {
	if (value == null || !Number.isFinite(value)) return "bg-muted/40 text-muted-foreground";
	if (value < 0.05) return "bg-muted/60 text-muted-foreground";
	if (value < 0.15) return "bg-primary/15 text-foreground/80";
	if (value < 0.3) return "bg-primary/30 text-foreground";
	if (value < 0.5) return "bg-primary/50 text-primary-foreground";
	return "bg-primary text-primary-foreground";
}

type BuilderRetentionHeatmapProps = {
	rows: CohortRetentionRow[];
};

export function BuilderRetentionHeatmap({ rows }: BuilderRetentionHeatmapProps) {
	if (rows.length === 0) {
		return (
			<Card variant="analytics">
				<CardContent className="text-sm text-muted-foreground">
					No retention data available.
				</CardContent>
			</Card>
		);
	}

	const sorted = [...rows].sort((a, b) => b.cohort_day - a.cohort_day);

	return (
		<Card variant="analytics">
			<CardContent className="space-y-4">
				<div className="flex items-center gap-1.5">
					<h3 className="text-sm font-medium text-muted-foreground">Cohort retention</h3>
					<InfoTooltip content="Share of new traders returning on day +1, +7, +30." />
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm tabular-nums">
						<thead>
							<tr className="text-left text-muted-foreground">
								<th className="px-2 py-1 font-normal">Cohort</th>
								<th className="px-2 py-1 font-normal">Size</th>
								{OFFSET_KEYS.map((k) => (
									<th key={k} className="px-2 py-1 font-normal">
										{OFFSET_LABELS[k]}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{sorted.map((row) => (
								<tr key={row.cohort_day} className="border-t border-border/50">
									<td className="whitespace-nowrap px-2 py-1 text-muted-foreground">
										{formatDateCompact(row.cohort_day)}
									</td>
									<td className="px-2 py-1 text-foreground">
										{formatNumber(row.cohort_size, { compact: true })}
									</td>
									{OFFSET_KEYS.map((k) => {
										const value = row.retention?.[k];
										const retained = row.retained?.[k];
										return (
											<td key={k} className="px-1 py-1">
												<span
													className={`inline-flex h-7 min-w-12 items-center justify-center rounded px-2 ${cellTone(value)}`}
													title={
														retained !== undefined
															? `${retained} of ${row.cohort_size} retained`
															: undefined
													}
												>
													{value != null && Number.isFinite(value)
														? formatNumber(value * 100, { decimals: 0, percent: true })
														: "—"}
												</span>
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
