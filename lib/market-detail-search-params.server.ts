import { createLoader, createParser, parseAsStringLiteral } from "nuqs/server";

import {
	defaultMarketDetailTab,
	marketPositivePageParserDef,
	marketDetailTabValues,
} from "./market-detail-search-params-shared";

const parseAsPositivePage = createParser<number>(marketPositivePageParserDef).withDefault(1);

const marketDetailSearchParamParsers = {
	tab: parseAsStringLiteral(marketDetailTabValues).withDefault(defaultMarketDetailTab),
	tradesPage: parseAsPositivePage,
};

export const loadMarketDetailSearchParams = createLoader(marketDetailSearchParamParsers);
