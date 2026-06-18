import { BuilderAvatar } from "@/components/builders/builder-avatar";
import { BuilderConcentrationCard } from "@/components/builders/builder-concentration-card";
import type { CompareBuilder } from "@/lib/struct/builder-compare";

type CompareConcentrationProps = {
	builders: CompareBuilder[];
};

export function CompareConcentration({ builders }: CompareConcentrationProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{builders.map((builder) => (
				<div key={builder.code} className="flex flex-col gap-2">
					<div className="flex min-w-0 items-center gap-2">
						<span
							className="size-2 shrink-0 rounded-full"
							style={{ backgroundColor: builder.color }}
							aria-hidden
						/>
						<BuilderAvatar
							builderCode={builder.code}
							iconUrl={builder.row.metadata?.icon_url}
							alt={`${builder.displayName} icon`}
							className="size-6!"
						/>
						<span
							className="min-w-0 truncate text-sm font-medium"
							title={builder.displayName}
						>
							{builder.displayName}
						</span>
					</div>
					<BuilderConcentrationCard data={builder.concentration} />
				</div>
			))}
		</div>
	);
}
