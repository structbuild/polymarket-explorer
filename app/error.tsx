"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Unable to render this page</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The request failed while loading content. Try again or verify your API
        credentials.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={reset} type="button">
          Retry
        </Button>
        {error.digest && (
          <span className="font-mono text-xs text-muted-foreground">
            Digest: {error.digest}
          </span>
        )}
      </div>
    </div>
  );
}
