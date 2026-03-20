"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Facehash } from "facehash";

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
			colorClasses={[
				"bg-slate-500",
				"bg-gray-500",
				"bg-zinc-500",
				"bg-neutral-500",
				"bg-stone-500",
				"bg-red-500",
				"bg-orange-500",
				"bg-amber-500",
				"bg-yellow-500",
				"bg-lime-500",
				"bg-green-500",
				"bg-emerald-500",
				"bg-teal-500",
				"bg-cyan-500",
				"bg-sky-500",
				"bg-blue-500",
				"bg-indigo-500",
				"bg-violet-500",
				"bg-purple-500",
				"bg-fuchsia-500",
				"bg-pink-500",
				"bg-rose-500",
			]}
			name={displayName}
		/>
	);
}
