"use client";

import { useMemo, useState } from "react";

import {
	AnalyticsChart,
	type AnalyticsSeries,
} from "@/components/analytics/analytics-chart";
import type { ComboGlobalAnalyticsBucketRow } from "@structbuild/sdk";

const VOLUME_COLOR = "var(--chart-2)";

const RANGE_OPTIONS = [
	{ label: "30D", days: 30 },
	{ label: "90D", days: 90 },
] as const;

type RangeDays = (typeof RANGE_OPTIONS)[number]["days"];

type ComboAnalyticsChartProps = {
	rows: ComboGlobalAnalyticsBucketRow[];
};

const SERIES: AnalyticsSeries[] = [{ key: "usdVolume", label: "Volume", color: VOLUME_COLOR }];

export function ComboAnalyticsChart({ rows }: ComboAnalyticsChartProps) {
	const [rangeDays, setRangeDays] = useState<RangeDays>(90);

	const data = useMemo(() => {
		const sliced = rows.slice(-rangeDays);
		return sliced.map((row) => ({ t: row.bucket, usdVolume: row.usd_volume }));
	}, [rows, rangeDays]);

	const showRangeToggle = rows.length > RANGE_OPTIONS[0].days;

	return (
		<div className="flex flex-col gap-2">
			{showRangeToggle ? (
				<div className="flex items-center justify-end gap-1">
					{RANGE_OPTIONS.map((option) => {
						const active = option.days === rangeDays;
						return (
							<button
								key={option.days}
								type="button"
								onClick={() => setRangeDays(option.days)}
								aria-pressed={active}
								className={`rounded-md px-2 py-1 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
									active
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{option.label}
							</button>
						);
					})}
				</div>
			) : null}
			<AnalyticsChart
				data={data}
				variant="bar"
				series={SERIES}
				valueFormat="currency"
				resolution="D"
				labelMode="bucket"
			/>
		</div>
	);
}
