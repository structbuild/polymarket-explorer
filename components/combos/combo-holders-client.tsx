"use client";

import { useMemo } from "react";

import {
	HoldersTable,
	type HolderColumnId,
	type HolderSide,
} from "@/components/holders/holders-table";
import type { ComboHolderSide } from "@/lib/struct/queries/combos";
import { getTraderDisplayName } from "@/lib/utils";

const columnIds: readonly HolderColumnId[] = [
	"rank",
	"trader",
	"shares",
	"avg_entry",
	"total_pnl",
	"realized_pnl",
	"unrealized_pnl",
	"trades",
	"fees",
	"first_trade",
	"last_trade",
];

const defaultColumnVisibility = {
	realized_pnl: false,
	unrealized_pnl: false,
	fees: false,
};

function toHolderSides(sides: ComboHolderSide[]): HolderSide[] {
	return sides.map((side) => ({
		positionId: side.positionId,
		outcomeName: side.outcomeName,
		totalHolders: side.totalHolders,
		holders: side.holders.map((holder, index) => ({
			rank: index + 1,
			address: holder.wallet,
			displayName: getTraderDisplayName({
				address: holder.wallet,
				name: holder.profile?.name,
				pseudonym: holder.profile?.pseudonym,
			}),
			profileImage: holder.profile?.profile_image,
			shares: holder.balance,
			valueUsd: null,
			avgEntryPrice: holder.pnl?.avg_entry_price ?? null,
			realizedPnlUsd: holder.pnl?.realized_pnl_usd ?? null,
			unrealizedPnlUsd: holder.pnl?.unrealized_pnl_usd ?? null,
			totalPnlUsd: holder.pnl?.total_pnl_usd ?? null,
			trades: (holder.pnl?.total_buys ?? 0) + (holder.pnl?.total_sells ?? 0),
			feesUsd: holder.pnl?.total_fees ?? null,
			firstTradeAt: holder.pnl?.first_trade_at ?? null,
			lastTradeAt: holder.pnl?.last_trade_at ?? null,
		})),
	}));
}

export function ComboHoldersClient({ sides }: { sides: ComboHolderSide[] }) {
	const holderSides = useMemo(() => toHolderSides(sides), [sides]);

	return (
		<HoldersTable
			sides={holderSides}
			columnIds={columnIds}
			storageKey="combo-holders-table"
			tableName="combo_holders"
			outcomeChangeEvent="combo_holders_outcome_changed"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No holders for this combo side."
		/>
	);
}
