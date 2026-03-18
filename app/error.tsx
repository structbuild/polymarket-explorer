"use client";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="status-card">
      <h2>Unable to render this page</h2>
      <p className="status-copy">
        The request failed while loading Struct-backed content. Try the request
        again, or verify the API credentials if the error persists.
      </p>
      <div className="pill-row">
        <button className="pill" onClick={reset} type="button">
          Retry request
        </button>
        {error.digest ? (
          <span className="pill mono">Digest: {error.digest}</span>
        ) : null}
      </div>
    </div>
  );
}

