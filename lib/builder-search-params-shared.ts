export const maxBuilderTradesPageNumber = 1000;

export const builderPositivePageParserDef = {
	parse(value: string) {
		const parsed = Number.parseInt(value, 10);
		return Number.isSafeInteger(parsed) && parsed > 0
			? Math.min(parsed, maxBuilderTradesPageNumber)
			: null;
	},
	serialize(value: number) {
		return String(value);
	},
};
