export const marketDetailTabValues = ["trades", "holders", "spikes", "holders-history"] as const;
export type MarketDetailTab = (typeof marketDetailTabValues)[number];

export const defaultMarketDetailTab: MarketDetailTab = "trades";
export const maxMarketTradesPageNumber = 1000;

export const marketPositivePageParserDef = {
	parse(value: string) {
		if (!/^[1-9]\d*$/.test(value)) {
			return null;
		}

		const parsed = Number(value);
		return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maxMarketTradesPageNumber) : null;
	},
	serialize(value: number) {
		return String(value);
	},
};
