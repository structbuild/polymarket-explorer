const MULTI_COLORS = [
	"bg-emerald-500",
	"bg-blue-500",
	"bg-amber-500",
	"bg-purple-500",
	"bg-rose-500",
];

type Outcome = {
	label: string;
	probability: number | null;
};

type OutcomeBarProps = {
	outcomes: Outcome[];
};

function formatPercent(probability: number | null): string {
	if (probability === null) return "\u2014";
	return `${(probability * 100).toFixed(0)}%`;
}

function BinaryBar({ outcomes }: { outcomes: Outcome[] }) {
	const yes = outcomes.find((o) => o.label.toLowerCase() === "yes");
	const no = outcomes.find((o) => o.label.toLowerCase() === "no");
	const yesPercent = yes?.probability !== null && yes?.probability !== undefined
		? yes.probability * 100
		: 50;

	return (
		<div className="space-y-2">
			<div className="flex h-3 w-full overflow-hidden rounded-full">
				<div
					className="bg-emerald-500 transition-all"
					style={{ width: `${yesPercent}%` }}
				/>
				<div
					className="bg-red-500 transition-all"
					style={{ width: `${100 - yesPercent}%` }}
				/>
			</div>
			<div className="flex items-center justify-between text-xs">
				<span className="text-emerald-500">
					Yes {formatPercent(yes?.probability ?? null)}
				</span>
				<span className="text-red-500">
					No {formatPercent(no?.probability ?? null)}
				</span>
			</div>
		</div>
	);
}

function MultiBar({ outcomes }: { outcomes: Outcome[] }) {
	const total = outcomes.reduce(
		(sum, o) => sum + (o.probability ?? 0),
		0,
	);

	return (
		<div className="space-y-2">
			<div className="flex h-3 w-full overflow-hidden rounded-full">
				{outcomes.map((outcome, index) => {
					const width = total > 0 && outcome.probability !== null
						? (outcome.probability / total) * 100
						: 0;
					return (
						<div
							key={outcome.label}
							className={`${MULTI_COLORS[index % MULTI_COLORS.length]} transition-all`}
							style={{ width: `${width}%` }}
						/>
					);
				})}
			</div>
			<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
				{outcomes.map((outcome, index) => (
					<span key={outcome.label} className="flex items-center gap-1">
						<span
							className={`inline-block size-2 rounded-full ${MULTI_COLORS[index % MULTI_COLORS.length]}`}
						/>
						{outcome.label} {formatPercent(outcome.probability)}
					</span>
				))}
			</div>
		</div>
	);
}

export function OutcomeBar({ outcomes }: OutcomeBarProps) {
	if (outcomes.length === 0) return null;

	const isBinary =
		outcomes.length === 2 &&
		outcomes.some((o) => o.label.toLowerCase() === "yes") &&
		outcomes.some((o) => o.label.toLowerCase() === "no");

	if (isBinary) {
		return <BinaryBar outcomes={outcomes} />;
	}

	return <MultiBar outcomes={outcomes} />;
}
