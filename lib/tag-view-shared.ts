export const tagViewValues = ["events", "markets"] as const;
export type TagView = (typeof tagViewValues)[number];
export const DEFAULT_TAG_VIEW: TagView = "events";

export function parseTagView(value: string | string[] | undefined): TagView {
	const raw = Array.isArray(value) ? value[0] : value;
	return tagViewValues.includes(raw as TagView) ? (raw as TagView) : DEFAULT_TAG_VIEW;
}
