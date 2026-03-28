import { createParser, parseAsStringLiteral, type inferParserType } from "nuqs";

import { maxTraderPageNumber, traderTabValues } from "./trader-search-params-shared";

const parseAsPositivePage = createParser<number>({
	parse(value) {
		const parsed = Number.parseInt(value, 10);
		return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maxTraderPageNumber) : null;
	},
	serialize(value) {
		return String(value);
	},
}).withDefault(1);

export const traderSearchParamParsers = {
	tab: parseAsStringLiteral(traderTabValues).withDefault("active"),
	openPage: parseAsPositivePage,
	closedPage: parseAsPositivePage,
	activityPage: parseAsPositivePage,
};

export type TraderSearchParams = inferParserType<typeof traderSearchParamParsers>;
