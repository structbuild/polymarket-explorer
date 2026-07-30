import { initBotId } from "botid/client/core";
import posthog from "posthog-js";

initBotId({
	protect: [
		{ path: "/", method: "POST" },
		{ path: "/*", method: "POST" },
	],
});

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
	api_host: "https://us.i.posthog.com",
	ui_host: "https://us.posthog.com",
	defaults: "2026-01-30",
	person_profiles: "always",
	capture_exceptions: true,
	debug: process.env.NODE_ENV === "development",
});
