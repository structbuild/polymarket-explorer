"use client";

import posthog from "posthog-js";

function deriveDestination(href: string) {
	try {
		const { hostname } = new URL(href);
		return hostname.replace(/^www\./, "");
	} catch {
		return "unknown";
	}
}

export function captureOutbound(href: string, meta?: Record<string, unknown>) {
	posthog.capture("outbound_link_clicked", {
		href,
		destination: deriveDestination(href),
		...meta,
	});
}

type ExternalLinkProps = React.ComponentPropsWithoutRef<"a"> & {
	href: string;
	linkType?: string;
};

export function ExternalLink({ href, linkType, onClick, children, ...props }: ExternalLinkProps) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			onClick={(event) => {
				captureOutbound(href, linkType ? { link_type: linkType } : undefined);
				onClick?.(event);
			}}
			{...props}
		>
			{children}
		</a>
	);
}
