"use client";

import { useScrollSpy } from "@/lib/hooks/use-scroll-spy";

import { SectionSubheader, SubheaderNavButton } from "./section-subheader";

export type SubheaderSlot =
	| { type: "anchor"; id: string; label: string }
	| { type: "tabs"; id: string; tabs: { value: string; label: string }[] };

function scrollToId(id: string) {
	const el = document.getElementById(id);
	if (!el) {
		return;
	}

	el.scrollIntoView({ behavior: "smooth", block: "start" });
	window.history.replaceState(window.history.state, "", `#${id}`);
}

export type SubheaderTabController = {
	active?: string;
	onSelect?: (value: string) => void;
};

export function SectionSubheaderBar({
	slots,
	tabControllers,
}: {
	slots: SubheaderSlot[];
	tabControllers?: Record<string, SubheaderTabController>;
}) {
	const activeId = useScrollSpy(slots.map((slot) => slot.id));

	return (
		<SectionSubheader>
			{slots.map((slot) => {
				if (slot.type === "anchor") {
					return (
						<SubheaderNavButton
							key={slot.id}
							active={activeId === slot.id}
							targetId={slot.id}
							onSelect={() => scrollToId(slot.id)}
						>
							{slot.label}
						</SubheaderNavButton>
					);
				}

				const controller = tabControllers?.[slot.id];
				return slot.tabs.map((tab) => (
					<SubheaderNavButton
						key={`${slot.id}:${tab.value}`}
						active={activeId === slot.id && controller?.active === tab.value}
						targetId={slot.id}
						onSelect={() => {
							controller?.onSelect?.(tab.value);
							scrollToId(slot.id);
						}}
					>
						{tab.label}
					</SubheaderNavButton>
				));
			})}
		</SectionSubheader>
	);
}
