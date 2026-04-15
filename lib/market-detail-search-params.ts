import { createParser, parseAsStringLiteral } from "nuqs";

import {
	defaultMarketDetailTab,
	marketPositivePageParserDef,
	marketDetailTabValues,
} from "./market-detail-search-params-shared";

const parseAsPositivePage = createParser<number>(marketPositivePageParserDef).withDefault(1);

export const marketDetailSearchParamParsers = {
	tab: parseAsStringLiteral(marketDetailTabValues).withDefault(defaultMarketDetailTab),
	tradesPage: parseAsPositivePage,
};
