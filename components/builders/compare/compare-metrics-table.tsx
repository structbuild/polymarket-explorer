import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Volume } from "@/components/ui/volume";
import {
	COMPARE_METRICS,
	bpsToLabel,
	type CompareMetric,
} from "@/lib/builder-compare-metrics";
import { formatNumber } from "@/lib/format";
import type { CompareBuilder } from "@/lib/struct/builder-compare";
import { cn } from "@/lib/utils";

function formatMetric(metric: CompareMetric, builder: CompareBuilder) {
	const value = metric.accessor(builder.row, builder.fees);
	if (metric.format === "volume") {
		return (
			<Volume
				usd={value}
				shares={builder.row.shares_volume ?? null}
				className="tabular-nums"
			/>
		);
	}
	if (value == null) return "—";
	if (metric.format === "bps") return bpsToLabel(value);
	if (metric.format === "currency") {
		return formatNumber(value, { compact: true, currency: true });
	}
	return formatNumber(value, { compact: true });
}

function bestCodeForMetric(metric: CompareMetric, builders: CompareBuilder[]): string | null {
	if (metric.neutral || builders.length < 2) return null;
	let bestCode: string | null = null;
	let bestValue: number | null = null;
	let ties = 0;
	for (const builder of builders) {
		const value = metric.accessor(builder.row, builder.fees);
		if (value == null) continue;
		if (bestValue == null) {
			bestValue = value;
			bestCode = builder.code;
			ties = 1;
			continue;
		}
		const isBetter = metric.higherIsBetter ? value > bestValue : value < bestValue;
		if (isBetter) {
			bestValue = value;
			bestCode = builder.code;
			ties = 1;
		} else if (value === bestValue) {
			ties += 1;
		}
	}
	return ties === 1 ? bestCode : null;
}

type CompareMetricsTableProps = {
	builders: CompareBuilder[];
};

export function CompareMetricsTable({ builders }: CompareMetricsTableProps) {
	return (
		<div className="overflow-hidden rounded-lg border border-border/60 bg-card">
			<div className="overflow-x-auto">
				<table className="w-full min-w-[520px] text-sm">
					<thead>
						<tr className="border-b border-border/60">
							<th
								scope="col"
								className="sticky left-0 z-10 bg-card px-3 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								Metric
							</th>
							{builders.map((builder) => (
								<th
									key={builder.code}
									scope="col"
									className="px-3 py-2.5 text-right font-medium"
								>
									<span className="inline-flex items-center gap-1.5">
										<span
											className="size-2 shrink-0 rounded-full"
											style={{ backgroundColor: builder.color }}
											aria-hidden
										/>
										<span
											className="max-w-[8rem] truncate"
											title={builder.displayName}
										>
											{builder.displayName}
										</span>
									</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{COMPARE_METRICS.map((metric) => {
							const bestCode = bestCodeForMetric(metric, builders);
							return (
								<tr key={metric.id} className="border-b border-border/40 last:border-0">
									<th
										scope="row"
										className="sticky left-0 z-10 bg-card px-3 py-2.5 text-left font-normal text-muted-foreground"
									>
										<span className="inline-flex items-center gap-1">
											{metric.label}
											{metric.description ? (
												<InfoTooltip content={metric.description} />
											) : null}
										</span>
									</th>
									{builders.map((builder) => {
										const isBest = bestCode === builder.code;
										return (
											<td
												key={builder.code}
												className="px-3 py-2.5 text-right tabular-nums"
											>
												<span
													className={cn(
														"inline-flex rounded-md px-1.5 py-0.5",
														isBest
															? "bg-primary font-medium text-primary-foreground"
															: "text-foreground/80",
													)}
												>
													{formatMetric(metric, builder)}
												</span>
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
