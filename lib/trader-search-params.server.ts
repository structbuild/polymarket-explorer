import { createLoader, createParser, parseAsStringLiteral } from "nuqs/server";

import { maxTraderPageNumber, pnlTimeframeValues, traderTabValues } from "./trader-search-params-shared";

const parseAsPositivePage = createParser<number>({
	parse(value) {
		const parsed = Number.parseInt(value, 10);
		return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maxTraderPageNumber) : null;
	},
	serialize(value) {
		return String(value);
	},
}).withDefault(1);

const traderSearchParamParsers = {
	tab: parseAsStringLiteral(traderTabValues).withDefault("active"),
	openPage: parseAsPositivePage,
	closedPage: parseAsPositivePage,
	activityPage: parseAsPositivePage,
	pnlTimeframe: parseAsStringLiteral(pnlTimeframeValues).withDefault("all"),
};

export const loadTraderSearchParams = createLoader(traderSearchParamParsers);
