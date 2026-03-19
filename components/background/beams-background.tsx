"use client";

import dynamic from "next/dynamic";

const Beams = dynamic(() => import("@/components/background/Beams"), { ssr: false });

export function BeamsBackground() {
	return (
		<div className="fixed inset-0 -z-10 opacity-40">
			<Beams speed={1} />
		</div>
	);
}
