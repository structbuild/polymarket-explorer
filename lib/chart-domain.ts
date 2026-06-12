export function computeProbabilityYDomain(
	data: ReadonlyArray<Record<string, number>>,
	keys: readonly string[],
): [number, number] {
	let min = Infinity;
	let max = -Infinity;
	for (const row of data) {
		for (const key of keys) {
			const v = row[key];
			if (typeof v === "number") {
				if (v < min) min = v;
				if (v > max) max = v;
			}
		}
	}
	if (!isFinite(min) || !isFinite(max)) return [0, 100];

	const range = max - min;
	const pad = Math.max(range * 0.05, 2);
	const rawLow = min - pad;
	const rawHigh = max + pad;
	const step = range >= 40 ? 10 : range >= 20 ? 5 : range >= 10 ? 2 : 1;
	const low = Math.max(0, Math.floor(rawLow / step) * step);
	const high = Math.min(100, Math.ceil(rawHigh / step) * step);
	return [low, high === low ? Math.min(100, low + step) : high];
}
