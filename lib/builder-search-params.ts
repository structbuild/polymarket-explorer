import { createParser } from "nuqs";

import { builderPositivePageParserDef } from "./builder-search-params-shared";

const parseAsPositivePage = createParser<number>(builderPositivePageParserDef).withDefault(1);

export const builderSearchParamParsers = {
	tradesPage: parseAsPositivePage,
};
