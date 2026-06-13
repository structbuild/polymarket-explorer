"use client";

import { useEffect, useState } from "react";

export function useScrollSpy(ids: string[], offset = 130) {
	const key = ids.join("\0");
	const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);

	useEffect(() => {
		const currentIds = key ? key.split("\0") : [];
		if (currentIds.length === 0) {
			return;
		}

		let frame = 0;

		const compute = () => {
			frame = 0;

			let current: string | null = null;
			for (const id of currentIds) {
				const el = document.getElementById(id);
				if (!el) {
					continue;
				}

				if (el.getBoundingClientRect().top - offset <= 0) {
					current = id;
				}
			}

			if (!current) {
				current = currentIds.find((id) => document.getElementById(id)) ?? currentIds[0] ?? null;
			}

			const scrolledToBottom =
				window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
			if (scrolledToBottom) {
				const last = [...currentIds].reverse().find((id) => document.getElementById(id));
				if (last) {
					current = last;
				}
			}

			setActiveId(current);
		};

		const onScroll = () => {
			if (frame) {
				return;
			}
			frame = requestAnimationFrame(compute);
		};

		compute();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);

		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (frame) {
				cancelAnimationFrame(frame);
			}
		};
	}, [key, offset]);

	return ids.length === 0 ? null : activeId;
}
