import type { Metadata } from "next";

export const SITE_NAME = "Polymarket Explorer";

export const SITE_DESCRIPTION =
	"Explore Polymarket prediction markets and traders. Browse odds, volume, leaderboards, and detailed trader analytics.";

const SEO_TITLE_MAX_LENGTH = 68;

function normalizeMetadataText(value: string) {
	return value.replace(/\s+/g, " ").trim();
}

export function buildEntityPageTitle(
	entityName: string,
	descriptor: string,
	maxLength: number = SEO_TITLE_MAX_LENGTH,
) {
	const normalizedEntityName = normalizeMetadataText(entityName);
	const normalizedDescriptor = normalizeMetadataText(descriptor);

	if (!normalizedEntityName) {
		return normalizedDescriptor;
	}

	if (!normalizedDescriptor) {
		return normalizedEntityName;
	}

	const fullTitle = `${normalizedEntityName} ${normalizedDescriptor}`;

	if (fullTitle.length <= maxLength) {
		return fullTitle;
	}

	const availableEntityLength = maxLength - normalizedDescriptor.length - 2;

	if (availableEntityLength < 20) {
		return `${normalizedEntityName.slice(0, maxLength - 1).trimEnd()}…`;
	}

	return `${normalizedEntityName.slice(0, availableEntityLength).trimEnd()}… ${normalizedDescriptor}`;
}

type BuildPageMetadataOptions = {
	title: string;
	description: string;
	canonical: string;
	openGraph?: Partial<NonNullable<Metadata["openGraph"]>>;
	twitter?: Partial<NonNullable<Metadata["twitter"]>>;
};

export function buildPageMetadata({
	title,
	description,
	canonical,
	openGraph,
	twitter,
}: BuildPageMetadataOptions): Metadata {
	return {
		title,
		description,
		alternates: {
			canonical,
		},
		openGraph: {
			title,
			description,
			type: "website",
			...openGraph,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			...twitter,
		},
	};
}
