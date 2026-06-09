"use client";

import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { captureOutbound } from "@/components/ui/external-link";

export function ViewProfileButton({ address }: { address: string }) {
	const href = `https://polymarket.com/${address}`;

	return (
		<Button
			className="w-full lg:w-fit"
			size="lg"
			nativeButton={false}
			render={
				<a
					href={href}
					rel="noreferrer"
					target="_blank"
					onClick={() => captureOutbound(href, { link_type: "polymarket_profile" })}
				/>
			}
		>
			View Profile
			<ExternalLinkIcon />
		</Button>
	);
}
