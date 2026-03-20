"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Beams = dynamic(() => import("@/components/background/Beams"), { ssr: false });

export function BeamsBackground() {
	const [showBeams, setShowBeams] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 640px)");
		const updateVisibility = () => setShowBeams(mediaQuery.matches);

		updateVisibility();
		mediaQuery.addEventListener("change", updateVisibility);

		return () => {
			mediaQuery.removeEventListener("change", updateVisibility);
		};
	}, []);

	return (
		<>
			<div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_40%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.08),transparent_42%)]" />
			{showBeams && (
				<div className="fixed inset-0 -z-10 opacity-40">
					<Beams speed={1} />
				</div>
			)}
		</>
	);
}
