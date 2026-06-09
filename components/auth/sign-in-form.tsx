"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type Step = "email" | "otp";
type SocialProvider = "google" | "github";

export function SignInForm({ onSuccess, callbackURL }: { onSuccess?: () => void; callbackURL?: string }) {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [step, setStep] = useState<Step>("email");
	const [loading, setLoading] = useState(false);
	const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleSocialSignIn(provider: SocialProvider) {
		posthog.capture("auth_social_provider_clicked", { provider });
		setSocialLoading(provider);
		setError(null);

		const resolvedCallback = callbackURL ?? (typeof window !== "undefined" ? window.location.href : "/");
		const { error } = await authClient.signIn.social({
			provider,
			callbackURL: resolvedCallback,
		});

		if (error) {
			setSocialLoading(null);
			setError(error.message ?? `Failed to sign in with ${provider}. Please try again.`);
		}
	}

	async function handleEmailSubmit(event: React.FormEvent) {
		event.preventDefault();
		posthog.capture("auth_email_submitted", {});
		setLoading(true);
		setError(null);

		const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });

		setLoading(false);

		if (error) {
			setError(error.message ?? "Failed to send verification code. Please try again.");
			return;
		}

		setStep("otp");
	}

	async function verifyOtp(code: string) {
		posthog.capture("auth_otp_submitted", {});
		setLoading(true);
		setError(null);

		const { data, error } = await authClient.signIn.emailOtp({ email, otp: code });

		if (error || !data) {
			setLoading(false);
			setError(error?.message ?? "Invalid code. Please try again.");
			return;
		}

		onSuccess?.();
	}

	if (step === "otp") {
		return (
			<form
				onSubmit={(event) => {
					event.preventDefault();
					verifyOtp(otp);
				}}
				className="space-y-4"
			>
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">
						We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
					</p>
					<Input
						inputMode="numeric"
						autoComplete="one-time-code"
						maxLength={6}
						placeholder="000000"
						value={otp}
						autoFocus
						onChange={(event) => {
							const next = event.target.value.replace(/\D/g, "").slice(0, 6);
							setOtp(next);
							if (next.length === 6) verifyOtp(next);
						}}
						className="h-11 text-center text-lg tracking-[0.4em]"
					/>
				</div>
				{error && <p className="text-sm text-destructive">{error}</p>}
				<Button type="submit" size="lg" className="w-full" disabled={loading || otp.length < 6}>
					{loading && <Loader2Icon className="size-4 animate-spin" />}
					{loading ? "Verifying..." : "Verify"}
				</Button>
				<button
					type="button"
					onClick={() => {
						posthog.capture("auth_back_to_email_clicked", {});
						setStep("email");
						setOtp("");
						setError(null);
					}}
					className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
				>
					Use a different email
				</button>
			</form>
		);
	}

	return (
		<div className="space-y-3">
			<div className="space-y-2">
				<Button
					type="button"
					variant="outline"
					size="lg"
					className="w-full justify-center"
					disabled={socialLoading !== null || loading}
					onClick={() => handleSocialSignIn("google")}
				>
					{socialLoading === "google" ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						<GoogleIcon className="size-4" />
					)}
					Continue with Google
				</Button>
				<Button
					type="button"
					variant="outline"
					size="lg"
					className="w-full justify-center"
					disabled={socialLoading !== null || loading}
					onClick={() => handleSocialSignIn("github")}
				>
					{socialLoading === "github" ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						<GithubIcon className="size-4" />
					)}
					Continue with GitHub
				</Button>
			</div>
			<div className="flex items-center gap-3">
				<div className="h-px flex-1 bg-border" />
				<span className="text-xs text-muted-foreground">OR</span>
				<div className="h-px flex-1 bg-border" />
			</div>
			<form onSubmit={handleEmailSubmit} className="space-y-3">
				<Input
					type="email"
					required
					placeholder="name@example.com"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					className="h-11"
				/>
				{error && <p className="text-sm text-destructive">{error}</p>}
				<Button type="submit" size="lg" className="w-full" disabled={loading || socialLoading !== null}>
					{loading && <Loader2Icon className="size-4 animate-spin" />}
					{loading ? "Sending code..." : "Continue with email"}
				</Button>
			</form>
		</div>
	);
}

function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			/>
			<path
				fill="#34A853"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			/>
			<path
				fill="#FBBC05"
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
			/>
			<path
				fill="#EA4335"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			/>
		</svg>
	);
}

function GithubIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path
				fill="currentColor"
				d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.97.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.9-.39s1.98.13 2.9.39c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.35.78 1.04.78 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"
			/>
		</svg>
	);
}
