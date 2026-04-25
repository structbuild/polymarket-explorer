import type { MarketOutcome, MarketResponse } from "@structbuild/sdk";

import { formatNumber } from "@/lib/format";

export type MarketJsonLdContext = {
	market: MarketResponse;
	url: string;
	siteName: string;
	imageUrl?: string;
};

function isoFromUnixSeconds(seconds: number | null | undefined): string | undefined {
	if (seconds == null || !Number.isFinite(seconds)) return undefined;
	return new Date(seconds * 1000).toISOString();
}

function getLeadingOutcome(outcomes: MarketOutcome[]): MarketOutcome | undefined {
	if (outcomes.length === 0) return undefined;
	return outcomes.reduce((best, o) => ((o.price ?? 0) > (best.price ?? 0) ? o : best), outcomes[0]);
}

function isBinary(outcomes: MarketOutcome[]): boolean {
	if (outcomes.length !== 2) return false;
	const names = outcomes.map((o) => o.name.toLowerCase());
	return names.includes("yes") && names.includes("no");
}

export function buildMarketJsonLd({ market, url, siteName, imageUrl }: MarketJsonLdContext) {
	const question = (market.question ?? market.title ?? "Prediction market").trim();
	const description = market.description?.trim() || undefined;
	const outcomes = market.outcomes ?? [];
	const isResolved = market.status === "closed" || market.status === "resolved";
	const winningOutcome = market.winning_outcome;
	const leading = getLeadingOutcome(outcomes);
	const binary = isBinary(outcomes);

	const volumeValue = market.metrics?.lifetime?.volume ?? market.volume_usd ?? 0;
	const holders = market.total_holders ?? 0;
	const volumeText = formatNumber(volumeValue, { compact: true, currency: true });
	const holdersText = formatNumber(holders, { decimals: 0 });
	const probabilityText = leading?.price != null ? `${(leading.price * 100).toFixed(0)}%` : null;

	const datePublished = isoFromUnixSeconds(market.created_time) ?? isoFromUnixSeconds(market.start_time);
	const dateModified = isoFromUnixSeconds(market.closed_time);
	const endDate = isoFromUnixSeconds(market.end_time);

	const answerBody = (() => {
		if (isResolved && winningOutcome) {
			return `Resolved: ${winningOutcome.name}. Total trading volume: ${volumeText} across ${holdersText} holders.${description ? ` ${description}` : ""}`;
		}
		if (leading && probabilityText) {
			return `${leading.name} is trading at ${probabilityText} on Polymarket, with ${volumeText} in lifetime volume across ${holdersText} holders.${description ? ` ${description}` : ""}`;
		}
		return `Prediction market on Polymarket with ${volumeText} in lifetime volume across ${holdersText} holders.${description ? ` ${description}` : ""}`;
	})();

	const graph: Record<string, unknown>[] = [];

	const questionNode: Record<string, unknown> = {
		"@type": "Question",
		"@id": `${url}#question`,
		name: question,
		text: question,
		answerCount: Math.max(outcomes.length, 1),
		...(dateModified && { dateModified }),
		...(datePublished && { datePublished }),
	};

	if (isResolved && winningOutcome) {
		questionNode.acceptedAnswer = {
			"@type": "Answer",
			text: answerBody,
			...(dateModified && { dateCreated: dateModified }),
			url,
		};
	} else if (leading) {
		const leadingAnswer = {
			"@type": "Answer",
			text: answerBody,
			...(dateModified && { dateCreated: dateModified }),
			url,
		};
		const otherAnswers = outcomes
			.filter((o) => o !== leading && o.price != null)
			.map((o) => ({
				"@type": "Answer",
				text: `${o.name} is trading at ${((o.price ?? 0) * 100).toFixed(0)}% on Polymarket.`,
				...(dateModified && { dateCreated: dateModified }),
				url,
			}));
		questionNode.suggestedAnswer = [leadingAnswer, ...otherAnswers];
	}

	graph.push({
		"@type": "QAPage",
		"@id": `${url}#qapage`,
		mainEntity: questionNode,
	});

	if (endDate) {
		const offers = outcomes
			.filter((o) => o.price != null)
			.map((o) => ({
				"@type": "Offer",
				name: o.name,
				price: (o.price ?? 0).toFixed(4),
				priceCurrency: "USD",
				availability: isResolved ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
				url,
			}));

		const eventNode: Record<string, unknown> = {
			"@type": "Event",
			"@id": `${url}#event`,
			name: question,
			description: description ?? `Polymarket prediction market: ${question}`,
			endDate,
			eventStatus: isResolved
				? "https://schema.org/EventCompleted"
				: "https://schema.org/EventScheduled",
			eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
			location: {
				"@type": "VirtualLocation",
				url: `https://polymarket.com/event/${market.event_slug ?? market.market_slug ?? ""}`,
			},
			organizer: {
				"@type": "Organization",
				name: "Polymarket",
				url: "https://polymarket.com",
			},
		};

		if (datePublished) eventNode.startDate = datePublished;
		if (imageUrl) eventNode.image = imageUrl;
		if (offers.length > 0) {
			eventNode.offers = binary && offers.length === 2
				? offers
				: {
						"@type": "AggregateOffer",
						offerCount: offers.length,
						priceCurrency: "USD",
						lowPrice: Math.min(...offers.map((o) => Number.parseFloat(o.price))).toFixed(4),
						highPrice: Math.max(...offers.map((o) => Number.parseFloat(o.price))).toFixed(4),
						offers,
					};
		}

		graph.push(eventNode);
	}

	if (isResolved) {
		const headline = winningOutcome
			? `${question} — Resolved: ${winningOutcome.name}`
			: `${question} — Resolved`;
		const articleNode: Record<string, unknown> = {
			"@type": "NewsArticle",
			"@id": `${url}#resolution`,
			headline: headline.length > 110 ? `${headline.slice(0, 107)}…` : headline,
			description: answerBody.length > 280 ? `${answerBody.slice(0, 277)}…` : answerBody,
			...(dateModified && { dateModified }),
			articleBody: description ?? answerBody,
			publisher: {
				"@type": "Organization",
				name: siteName,
			},
		};
		if (datePublished) articleNode.datePublished = datePublished;
		if (imageUrl) articleNode.image = imageUrl;
		graph.push(articleNode);
	}

	return { "@context": "https://schema.org", "@graph": graph };
}
