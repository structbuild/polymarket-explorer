import type { PnlDataPoint } from "@/lib/struct/pnl";

export type WirePnlPoint = {
	t: number;
	c: number;
	o?: number;
	h?: number;
	l?: number;
	ub?: number;
	nop?: number;
};

export const SSR_PNL_WIRE_MAX_POINTS = 500;

export function downsamplePnlPoints<T extends { t: number }>(points: T[], maxPoints: number): T[] {
	if (points.length <= maxPoints) return points;
	const step = points.length / maxPoints;
	const sampled: T[] = [];
	for (let i = 0; i < maxPoints; i += 1) {
		sampled.push(points[Math.min(Math.floor(i * step), points.length - 1)]);
	}
	const last = points[points.length - 1];
	if (sampled[sampled.length - 1]?.t !== last.t) {
		sampled[sampled.length - 1] = last;
	}
	return sampled;
}

export function compactPnlDataPointsForWire(points: PnlDataPoint[]): WirePnlPoint[] {
	const sampled = downsamplePnlPoints(points, SSR_PNL_WIRE_MAX_POINTS);
	return sampled.map((point) => {
		const wire: WirePnlPoint = { t: point.t, c: point.p };
		if (point.open !== point.p) wire.o = point.open;
		if (point.high !== point.p) wire.h = point.high;
		if (point.low !== point.p) wire.l = point.low;
		if (point.usdBalance !== 0) wire.ub = point.usdBalance;
		if (point.numOpenPositions !== 0) wire.nop = point.numOpenPositions;
		return wire;
	});
}

export function expandPnlDataPointsFromWire(points: WirePnlPoint[]): PnlDataPoint[] {
	return points.map((point) => {
		const close = point.c;
		const open = point.o ?? close;
		const high = point.h ?? Math.max(open, close);
		const low = point.l ?? Math.min(open, close);
		return {
			t: point.t,
			open,
			high,
			low,
			close,
			p: close,
			realizedOpen: close,
			realizedHigh: close,
			realizedLow: close,
			realizedClose: close,
			unrealizedOpen: 0,
			unrealizedHigh: 0,
			unrealizedLow: 0,
			unrealizedClose: 0,
			portfolioOpen: close,
			portfolioHigh: high,
			portfolioLow: low,
			portfolioClose: close,
			numOpenPositions: point.nop ?? 0,
			usdBalance: point.ub ?? 0,
		};
	});
}
