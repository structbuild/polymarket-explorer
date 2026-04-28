import { createLoader, createParser } from "nuqs/server";

import { builderPositivePageParserDef } from "./builder-search-params-shared";

const parseAsPositivePage = createParser<number>(builderPositivePageParserDef).withDefault(1);

const builderSearchParamParsers = {
	tradesPage: parseAsPositivePage,
};

export const loadBuilderSearchParams = createLoader(builderSearchParamParsers);
