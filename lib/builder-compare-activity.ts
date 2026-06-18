import type { AnalyticsPoint } from "@/lib/struct/analytics-shared";

export type CompareActivityMetric = {
	id: string;
	label: string;
	format: "currency" | "count";
	isVolume?: boolean;
	selector: (point: AnalyticsPoint) => number;
};

export const COMPARE_ACTIVITY_METRICS: readonly CompareActivityMetric[] = [
	{ id: "volume", label: "Volume", format: "currency", isVolume: true, selector: (p) => p.volumeUsd },
	{ id: "builderFees", label: "Builder fees", format: "currency", selector: (p) => p.builderFeesUsd },
	{ id: "trades", label: "Trades", format: "count", selector: (p) => p.txnCount },
	{ id: "uniqueTraders", label: "Traders", format: "count", selector: (p) => p.uniqueTraders },
	{ id: "newUsers", label: "New users", format: "count", selector: (p) => p.newUsers },
	{ id: "fees", label: "Fees", format: "currency", selector: (p) => p.feesUsd },
	{ id: "makers", label: "Makers", format: "count", selector: (p) => p.uniqueTakers },
	{ id: "takers", label: "Takers", format: "count", selector: (p) => p.uniqueMakers },
];
