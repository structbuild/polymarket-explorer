import { cn } from "@/lib/utils";

type Outcome = {
	label: string;
	probability: number | null;
};

type MarketOutcomesProps = {
	outcomes: Outcome[];
};

const OUTCOME_STYLES = [
	{ text: "text-emerald-500", bg: "bg-emerald-500", bgMuted: "bg-emerald-500/15" },
	{ text: "text-red-500", bg: "bg-red-500", bgMuted: "bg-red-500/15" },
	{ text: "text-blue-500", bg: "bg-blue-500", bgMuted: "bg-blue-500/15" },
	{ text: "text-amber-500", bg: "bg-amber-500", bgMuted: "bg-amber-500/15" },
	{ text: "text-purple-500", bg: "bg-purple-500", bgMuted: "bg-purple-500/15" },
];

function formatPercent(probability: number | null): string {
	if (probability === null) return "\u2014";
	return `${(probability * 100).toFixed(0)}%`;
}

function OutcomeRow({
	outcome,
	styleIndex,
	isLeading,
}: {
	outcome: Outcome;
	styleIndex: number;
	isLeading: boolean;
}) {
	const style = OUTCOME_STYLES[styleIndex % OUTCOME_STYLES.length];
	const percent = outcome.probability !== null ? outcome.probability * 100 : 0;

	return (
		<div className="space-y-1.5">
			<div className="flex items-baseline justify-between gap-3">
				<span className={cn(
					"text-sm font-medium",
					isLeading ? "text-foreground" : "text-muted-foreground",
				)}>
					{outcome.label}
				</span>
				<span className={cn(
					"font-mono text-lg font-semibold tabular-nums",
					style.text,
				)}>
					{formatPercent(outcome.probability)}
				</span>
			</div>
			<div className={cn("h-2 w-full overflow-hidden rounded-full", style.bgMuted)}>
				<div
					className={cn("h-full rounded-full transition-all duration-500", style.bg)}
					style={{ width: `${Math.max(percent, 1)}%` }}
				/>
			</div>
		</div>
	);
}

function BinaryOutcomes({ outcomes }: { outcomes: Outcome[] }) {
	const yes = outcomes.find((o) => o.label.toLowerCase() === "yes");
	const no = outcomes.find((o) => o.label.toLowerCase() === "no");

	if (!yes || !no) return null;

	const yesPercent = yes.probability !== null ? yes.probability * 100 : 50;
	const yesLeading = (yes.probability ?? 0) >= (no.probability ?? 0);

	return (
		<div className="space-y-4">
			<div className="flex items-end justify-between gap-4">
				<div className="space-y-0.5">
					<span className="text-xs text-muted-foreground">Yes</span>
					<p className={cn(
						"font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
						yesLeading ? "text-emerald-500" : "text-muted-foreground",
					)}>
						{formatPercent(yes.probability)}
					</p>
				</div>
				<div className="space-y-0.5 text-right">
					<span className="text-xs text-muted-foreground">No</span>
					<p className={cn(
						"font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
						!yesLeading ? "text-red-500" : "text-muted-foreground",
					)}>
						{formatPercent(no.probability)}
					</p>
				</div>
			</div>

			<div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/50">
				<div
					className="rounded-full bg-emerald-500 transition-all duration-500"
					style={{ width: `${yesPercent}%` }}
				/>
				<div
					className="rounded-full bg-red-500 transition-all duration-500"
					style={{ width: `${100 - yesPercent}%` }}
				/>
			</div>
		</div>
	);
}

function MultiOutcomes({ outcomes }: { outcomes: Outcome[] }) {
	const sorted = [...outcomes].sort(
		(a, b) => (b.probability ?? 0) - (a.probability ?? 0),
	);
	const leadingLabel = sorted[0]?.label;

	return (
		<div className="space-y-3">
			{sorted.map((outcome, idx) => {
				const originalIndex = outcomes.indexOf(outcome);
				return (
					<OutcomeRow
						key={outcome.label}
						outcome={outcome}
						styleIndex={originalIndex}
						isLeading={outcome.label === leadingLabel}
					/>
				);
			})}
		</div>
	);
}

export function MarketOutcomes({ outcomes }: MarketOutcomesProps) {
	if (outcomes.length === 0) return null;

	const isBinary =
		outcomes.length === 2 &&
		outcomes.some((o) => o.label.toLowerCase() === "yes") &&
		outcomes.some((o) => o.label.toLowerCase() === "no");

	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<h2 className="mb-4 text-sm font-medium text-muted-foreground">
				Current Odds
			</h2>
			{isBinary ? (
				<BinaryOutcomes outcomes={outcomes} />
			) : (
				<MultiOutcomes outcomes={outcomes} />
			)}
		</div>
	);
}
