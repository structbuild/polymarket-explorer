import "server-only";

import type {
	BuilderFeeRate,
	BuilderLatestRowWithMetadata,
	BuilderMetadata,
	BuilderTagRow,
} from "@structbuild/sdk";
import { cache } from "react";

import { getSiteUrl } from "@/lib/env";
import { formatNumber } from "@/lib/format";
import { buildEntityPageTitle } from "@/lib/site-metadata";
import {
	getBuilderByCode,
	getBuilderFees,
	getBuilderMetadata,
	getBuilderTags,
} from "@/lib/struct/builder-queries";
import { getBuilderDisplayName } from "@/lib/builder-display-name";
import { formatBuilderCodeDisplay } from "@/lib/utils";

export const builderOgImageSize = {
	width: 1200,
	height: 630,
} as const;

export type BuilderOpenGraphIdentity = {
	code: string;
	displayName: string;
	codeLabel: string;
	metadata: BuilderMetadata | null;
};

export type BuilderOpenGraphData = {
	code: string;
	displayName: string;
	codeLabel: string;
	metadata: BuilderMetadata | null;
	builder: BuilderLatestRowWithMetadata | null;
	fees: BuilderFeeRate | null;
	tags: BuilderTagRow[];
};

export function getBuilderPageTitle(displayName: string, builder: BuilderLatestRowWithMetadata | null) {
	const volume = builder?.volume_usd ?? 0;
	if (Number.isFinite(volume) && volume >= 1000) {
		const volumeText = formatNumber(volume, { compact: true, currency: true });
		return buildEntityPageTitle(displayName, `${volumeText} Volume · Polymarket Builder`);
	}
	return buildEntityPageTitle(displayName, "Polymarket Builder");
}

export function getBuilderSocialTitle(displayName: string, builder: BuilderLatestRowWithMetadata | null) {
	return getBuilderPageTitle(displayName, builder);
}

export function getBuilderPageDescription(
	displayName: string,
	codeLabel: string,
	builder: BuilderLatestRowWithMetadata | null,
) {
	const stats: string[] = [];
	const volume = builder?.volume_usd;
	const builderFees = builder?.builder_fees;
	const traders = builder?.unique_traders;
	const trades = builder?.txn_count;

	if (typeof volume === "number" && volume > 0) {
		stats.push(`${formatNumber(volume, { compact: true, currency: true })} volume`);
	}
	if (typeof builderFees === "number" && builderFees > 0) {
		stats.push(`${formatNumber(builderFees, { compact: true, currency: true })} builder fees`);
	}
	if (typeof traders === "number" && traders > 0) {
		stats.push(`${formatNumber(traders, { decimals: 0 })} traders`);
	}
	if (typeof trades === "number" && trades > 0) {
		stats.push(`${formatNumber(trades, { decimals: 0 })} trades`);
	}

	const displayIsCode = displayName === codeLabel;
	const lead = displayIsCode ? codeLabel : `${displayName} (${codeLabel})`;
	const leadIn = `Builder ${lead} on Polymarket`;
	const tail = "View routing volume, fees earned, top traders, retention, and tag breakdown.";

	if (stats.length === 0) {
		return `${leadIn}. ${tail}`;
	}

	return `${leadIn}: ${stats.join(", ")}. ${tail}`;
}

export function getBuilderOgImageAlt(displayName: string) {
	return `${displayName} builder summary on Polymarket Explorer`;
}

export function getBuilderOgImageUrl(code: string) {
	return new URL(`/builders/${encodeURIComponent(code)}/opengraph-image`, getSiteUrl());
}

const loadBuilderOpenGraphIdentityCached = cache(async (code: string): Promise<BuilderOpenGraphIdentity> => {
	const metadata = await getBuilderMetadata(code);

	return {
		code,
		codeLabel: formatBuilderCodeDisplay(code),
		displayName: getBuilderDisplayName(code, metadata),
		metadata,
	};
});

export async function loadBuilderOpenGraphIdentity(code: string): Promise<BuilderOpenGraphIdentity> {
	return loadBuilderOpenGraphIdentityCached(code);
}

const loadBuilderOpenGraphDataCached = cache(async (code: string): Promise<BuilderOpenGraphData> => {
	const [identity, builder, fees, tags] = await Promise.all([
		loadBuilderOpenGraphIdentityCached(code),
		getBuilderByCode(code, "lifetime"),
		getBuilderFees(code),
		getBuilderTags(code, "volume", "lifetime", 8),
	]);

	return {
		code: identity.code,
		codeLabel: identity.codeLabel,
		displayName: identity.displayName,
		metadata: identity.metadata,
		builder,
		fees,
		tags,
	};
});

export async function loadBuilderOpenGraphData(code: string): Promise<BuilderOpenGraphData> {
	return loadBuilderOpenGraphDataCached(code);
}
