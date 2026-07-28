import type { PnlDataPoint } from "@/lib/struct/pnl";

export type WireOhlc = { c: number; o?: number; h?: number; l?: number };

export type WirePnlPoint = {
	t: number;
	v?: WireOhlc;
	r?: WireOhlc;
	u?: WireOhlc;
	p?: WireOhlc;
	nop?: number;
	ub?: number;
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

function packOhlc(open: number, high: number, low: number, close: number): WireOhlc | undefined {
	if (open === 0 && high === 0 && low === 0 && close === 0) return undefined;
	const wire: WireOhlc = { c: close };
	if (open !== close) wire.o = open;
	if (high !== close) wire.h = high;
	if (low !== close) wire.l = low;
	return wire;
}

function unpackOhlc(wire: WireOhlc | undefined) {
	const close = wire?.c ?? 0;
	return {
		open: wire?.o ?? close,
		high: wire?.h ?? close,
		low: wire?.l ?? close,
		close,
	};
}

export function compactPnlDataPointsForWire(points: PnlDataPoint[]): WirePnlPoint[] {
	const sampled = downsamplePnlPoints(points, SSR_PNL_WIRE_MAX_POINTS);
	return sampled.map((point) => {
		const wire: WirePnlPoint = { t: point.t };
		const total = packOhlc(point.open, point.high, point.low, point.close);
		const realized = packOhlc(point.realizedOpen, point.realizedHigh, point.realizedLow, point.realizedClose);
		const unrealized = packOhlc(
			point.unrealizedOpen,
			point.unrealizedHigh,
			point.unrealizedLow,
			point.unrealizedClose,
		);
		const portfolio = packOhlc(point.portfolioOpen, point.portfolioHigh, point.portfolioLow, point.portfolioClose);
		if (total) wire.v = total;
		if (realized) wire.r = realized;
		if (unrealized) wire.u = unrealized;
		if (portfolio) wire.p = portfolio;
		if (point.numOpenPositions !== 0) wire.nop = point.numOpenPositions;
		if (point.usdBalance !== 0) wire.ub = point.usdBalance;
		return wire;
	});
}

export function expandPnlDataPointsFromWire(points: WirePnlPoint[]): PnlDataPoint[] {
	return points.map((point) => {
		const total = unpackOhlc(point.v);
		const realized = unpackOhlc(point.r);
		const unrealized = unpackOhlc(point.u);
		const portfolio = unpackOhlc(point.p);
		return {
			t: point.t,
			open: total.open,
			high: total.high,
			low: total.low,
			close: total.close,
			p: total.close,
			realizedOpen: realized.open,
			realizedHigh: realized.high,
			realizedLow: realized.low,
			realizedClose: realized.close,
			unrealizedOpen: unrealized.open,
			unrealizedHigh: unrealized.high,
			unrealizedLow: unrealized.low,
			unrealizedClose: unrealized.close,
			portfolioOpen: portfolio.open,
			portfolioHigh: portfolio.high,
			portfolioLow: portfolio.low,
			portfolioClose: portfolio.close,
			numOpenPositions: point.nop ?? 0,
			usdBalance: point.ub ?? 0,
		};
	});
}
