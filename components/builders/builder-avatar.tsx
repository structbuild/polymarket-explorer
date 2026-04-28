"use client";

import { Facehash } from "facehash";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { facehashColorClasses } from "@/lib/facehash";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

type BuilderAvatarProps = {
	builderCode: string;
	iconUrl?: string | null;
	alt?: string;
	className?: string;
};

export function BuilderAvatar({ builderCode, iconUrl, alt, className }: BuilderAvatarProps) {
	const normalized =
		iconUrl != null ? normalizePolymarketS3ImageUrl(iconUrl.trim()) ?? iconUrl.trim() : null;

	if (normalized) {
		return (
			<Avatar className={cn("shrink-0 overflow-hidden rounded-lg after:rounded-lg", className)}>
				<AvatarImage src={normalized} alt={alt ?? ""} className="rounded-lg object-cover" />
				<AvatarFallback className="overflow-hidden rounded-lg p-0">
					<Facehash
						className="size-full border-0 rounded-lg"
						colorClasses={facehashColorClasses}
						name={builderCode}
					/>
				</AvatarFallback>
			</Avatar>
		);
	}

	return (
		<Facehash
			className={cn("shrink-0 overflow-hidden rounded-lg border", className)}
			colorClasses={facehashColorClasses}
			name={builderCode}
		/>
	);
}
