import { ComboHoldersClient } from "@/components/combos/combo-holders-client";
import { HoldersTableFallback } from "@/components/holders/holders-table";
import { getComboConditionHolders } from "@/lib/struct/queries/combos";

export async function ComboHolders({ conditionId }: { conditionId: string }) {
	const sides = await getComboConditionHolders(conditionId);
	const hasHolders = sides.some((side) => side.holders.length > 0);

	if (!hasHolders) {
		return (
			<div className="rounded-lg bg-card px-4 py-12 text-center text-sm text-muted-foreground sm:px-6">
				No holders yet
			</div>
		);
	}

	return <ComboHoldersClient sides={sides} />;
}

export function ComboHoldersFallback() {
	return <HoldersTableFallback />;
}
