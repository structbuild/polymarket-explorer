"use client";

import { Facehash } from "facehash";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { facehashColorClasses } from "@/lib/facehash";
import { cn } from "@/lib/utils";

type TraderAvatarProps = {
	displayName: string;
	profileImage?: string | null;
	className?: string;
	rounded?: "md" | "lg";
};

export function TraderAvatar({
	displayName,
	profileImage,
	className,
	rounded = "lg",
}: TraderAvatarProps) {
	const roundedClass = rounded === "md" ? "rounded-md after:rounded-md" : "rounded-lg after:rounded-lg";
	const imageRoundedClass = rounded === "md" ? "rounded-md" : "rounded-lg";
	const facehashRoundedClass = rounded === "md" ? "rounded-md" : "rounded-lg";

	if (profileImage) {
		return (
			<Avatar className={cn(roundedClass, className)}>
				<AvatarImage src={profileImage} className={imageRoundedClass} />
				<AvatarFallback className={cn(imageRoundedClass, "text-lg")}>
					{displayName.slice(0, 2).toUpperCase()}
				</AvatarFallback>
			</Avatar>
		);
	}

	return (
		<Facehash
			className={cn("border shrink-0 overflow-hidden", facehashRoundedClass, className)}
			colorClasses={facehashColorClasses}
			name={displayName}
		/>
	);
}
