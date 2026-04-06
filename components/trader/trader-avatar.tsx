"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Facehash } from "facehash";
import { facehashColorClasses } from "@/lib/facehash";

type TraderAvatarProps = {
	displayName: string;
	profileImage?: string | null;
};

export function TraderAvatar({ displayName, profileImage }: TraderAvatarProps) {
	if (profileImage) {
		return (
			<Avatar size="xl" className="size-16! rounded-lg after:rounded-lg sm:size-24!">
				<AvatarImage src={profileImage} className="rounded-lg" />
				<AvatarFallback className="rounded-lg text-lg">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>
		);
	}

	return (
		<Facehash
			className="border size-16! shrink-0 overflow-hidden rounded-lg sm:size-24!"
			colorClasses={facehashColorClasses}
			name={displayName}
		/>
	);
}
