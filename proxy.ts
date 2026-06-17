import { NextRequest, NextResponse } from "next/server";

import { getAuthBaseUrl, getSitePasswordGate } from "@/lib/env";

const GATED_PREFIXES = ["/account"];

function isGatedRoute(pathname: string): boolean {
	return GATED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let index = 0; index < a.length; index += 1) {
		mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
	}
	return mismatch === 0;
}

function isPasswordAuthorized(request: NextRequest, password: string): boolean {
	const header = request.headers.get("authorization");
	if (!header?.startsWith("Basic ")) return false;

	try {
		const decoded = atob(header.slice("Basic ".length));
		const separatorIndex = decoded.indexOf(":");
		const provided = separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1);
		return timingSafeEqual(provided, password);
	} catch {
		return false;
	}
}

function passwordPromptResponse(): NextResponse {
	return new NextResponse("Authentication required", {
		status: 401,
		headers: {
			"WWW-Authenticate": 'Basic realm="Restricted", charset="UTF-8"',
		},
	});
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
	const cookie = request.headers.get("cookie");
	if (!cookie) return false;

	try {
		const response = await fetch(`${getAuthBaseUrl()}/api/auth/get-session?disableCookieCache=true`, {
			method: "GET",
			headers: { cookie },
			cache: "no-store",
		});

		if (!response.ok) return false;

		const payload: unknown = await response.json();
		if (!payload || typeof payload !== "object") return false;
		const { session, user } = payload as { session?: unknown; user?: unknown };
		return session != null && user != null;
	} catch {
		return false;
	}
}

export async function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	const passwordGate = getSitePasswordGate();
	if (passwordGate.enabled && passwordGate.password && !isPasswordAuthorized(request, passwordGate.password)) {
		return passwordPromptResponse();
	}

	if (!isGatedRoute(pathname)) {
		return NextResponse.next();
	}

	const isAuthenticated = await hasValidSession(request);
	if (!isAuthenticated) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
