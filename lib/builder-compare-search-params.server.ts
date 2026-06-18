import { createLoader, createParser, parseAsStringLiteral } from "nuqs/server";

import { compareCodesParserDef } from "./builder-compare-search-params-shared";
import {
	BUILDER_TIMEFRAME_OPTIONS,
	DEFAULT_BUILDER_TIMEFRAME,
} from "./struct/builder-shared";

const builderCompareSearchParamParsers = {
	codes: createParser<string[]>(compareCodesParserDef).withDefault([]),
	timeframe: parseAsStringLiteral(BUILDER_TIMEFRAME_OPTIONS).withDefault(
		DEFAULT_BUILDER_TIMEFRAME,
	),
};

export const loadBuilderCompareSearchParams = createLoader(builderCompareSearchParamParsers);
