import type { CohortRetentionRow } from "@structbuild/sdk";

import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { formatDateCompact, formatDateFull, formatNumber } from "@/lib/format";

const OFFSET_KEYS: readonly string[] = ["1", "7", "30"];
const OFFSET_LABELS: Record<string, string> = {
	"1": "D1",
	"7": "D7",
	"30": "D30",
};
const OFFSET_DESCRIPTIONS: Record<string, string> = {
	"1": "1 day later",
	"7": "7 days later",
	"30": "30 days later",
};
const DAY_SECONDS = 86400;

function cellTone(value: number | undefined): string {
	if (value == null || !Number.isFinite(value)) return "bg-muted/40 text-muted-foreground";
	if (value < 0.05) return "bg-muted/60 text-muted-foreground";
	if (value < 0.15) return "bg-primary/15 text-foreground/80";
	if (value < 0.3) return "bg-primary/30 text-foreground";
	if (value < 0.5) return "bg-primary/50 text-primary-foreground";
	return "bg-primary text-primary-foreground";
}

function offsetDate(cohortDay: number, offsetDays: string): string {
	return formatDateFull(cohortDay + Number(offsetDays) * DAY_SECONDS);
}

function formatRetentionPct(value: number): string {
	return formatNumber(value * 100, { decimals: 0, percent: true });
}

function retentionTooltip(
	row: CohortRetentionRow,
	offsetDays: string,
	value: number | undefined,
	retained: number | undefined,
): string {
	const label = OFFSET_LABELS[offsetDays];
	const cohortDate = formatDateFull(row.cohort_day);
	const returnDate = offsetDate(row.cohort_day, offsetDays);
	const offsetDescription = OFFSET_DESCRIPTIONS[offsetDays];
	const cohortSize = formatNumber(row.cohort_size);

	if (value == null || !Number.isFinite(value)) {
		return `${label} is not available for the ${cohortDate} cohort. It may be too recent to have a full ${offsetDescription} retention window.`;
	}

	const retainedText =
		retained !== undefined
			? `${formatNumber(retained)} of ${cohortSize}`
			: `${formatRetentionPct(value)} of`;

	return `${label} retention: ${retainedText} traders whose first trade with this builder was on ${cohortDate} were active with the builder again ${offsetDescription}, on ${returnDate}.`;
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
								<th className="px-2 py-1 font-normal">
									<TooltipWrapper content="The date these traders made their first-ever trade with this builder.">
										<span className="inline-flex cursor-help rounded-sm underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
											Cohort
										</span>
									</TooltipWrapper>
								</th>
								<th className="px-2 py-1 font-normal">
									<TooltipWrapper content="Number of distinct traders whose first-ever trade with this builder landed in this cohort.">
										<span className="inline-flex cursor-help rounded-sm underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
											Size
										</span>
									</TooltipWrapper>
								</th>
								{OFFSET_KEYS.map((k) => (
									<th key={k} className="px-2 py-1 font-normal">
										<TooltipWrapper
											content={`Share of the cohort active with this builder again ${OFFSET_DESCRIPTIONS[k]}.`}
										>
											<span className="inline-flex cursor-help rounded-sm underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
												{OFFSET_LABELS[k]}
											</span>
										</TooltipWrapper>
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
										const tooltip = retentionTooltip(row, k, value, retained);
										return (
											<td key={k} className="px-1 py-1">
												<TooltipWrapper content={tooltip}>
													<span
														tabIndex={0}
														aria-label={tooltip}
														className={`inline-flex h-7 min-w-12 cursor-help items-center justify-center rounded px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${cellTone(value)}`}
													>
														{value != null && Number.isFinite(value)
															? formatRetentionPct(value)
															: "—"}
													</span>
												</TooltipWrapper>
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
