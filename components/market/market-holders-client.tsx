"use client";

import { useMemo } from "react";
import type { OutcomeHolders } from "@structbuild/sdk";

import {
	HoldersTable,
	type HolderColumnId,
	type HolderSide,
} from "@/components/holders/holders-table";
import { getTraderDisplayName } from "@/lib/utils";

const columnIds: readonly HolderColumnId[] = [
	"rank",
	"trader",
	"shares",
	"value",
	"avg_entry",
	"realized_pnl",
	"trades",
	"fees",
	"first_trade",
	"last_trade",
];

const defaultColumnVisibility = {
	realized_pnl: false,
	fees: false,
};

function toNumber(value: string | number | null | undefined): number | null {
	if (value == null) return null;
	const n = typeof value === "string" ? Number(value) : value;
	return Number.isFinite(n) ? n : null;
}

function toHolderSides(outcomes: OutcomeHolders[]): HolderSide[] {
	return outcomes.map((outcome) => ({
		positionId: outcome.position_id,
		outcomeName: outcome.outcome_name,
		totalHolders: outcome.total_holders,
		holders: outcome.holders.map((holder, index) => {
			const buyVolume = toNumber(holder.pnl?.buy_volume_usd);
			const sharesBought = toNumber(holder.pnl?.total_shares_bought);

			return {
				rank: index + 1,
				address: holder.trader.address,
				displayName: getTraderDisplayName(holder.trader),
				profileImage: holder.trader.profile_image,
				shares: toNumber(holder.shares),
				valueUsd: toNumber(holder.shares_usd),
				avgEntryPrice:
					buyVolume != null && sharesBought != null && sharesBought > 0 ? buyVolume / sharesBought : null,
				realizedPnlUsd: toNumber(holder.pnl?.realized_pnl_usd),
				unrealizedPnlUsd: toNumber(holder.pnl?.unrealized_pnl_usd),
				totalPnlUsd: toNumber(holder.pnl?.total_pnl_usd),
				trades: (holder.pnl?.total_buys ?? 0) + (holder.pnl?.total_sells ?? 0),
				feesUsd: toNumber(holder.pnl?.total_fees),
				firstTradeAt: toNumber(holder.pnl?.first_trade_at),
				lastTradeAt: toNumber(holder.pnl?.last_trade_at),
			};
		}),
	}));
}

export function MarketHoldersClient({ outcomes }: { outcomes: OutcomeHolders[] }) {
	const sides = useMemo(() => toHolderSides(outcomes), [outcomes]);

	return (
		<HoldersTable
			sides={sides}
			columnIds={columnIds}
			storageKey="market-holders-table"
			tableName="market_holders"
			outcomeChangeEvent="market_holders_outcome_changed"
			defaultColumnVisibility={defaultColumnVisibility}
		/>
	);
}
