import Link from "next/link";

export default function NotFound() {
  return (
    <section className="status-card">
      <h2>Market not found</h2>
      <p className="status-copy">
        This market slug did not resolve to a Struct result. It may have been
        removed, renamed, or never existed.
      </p>
      <div className="pill-row">
        <Link className="pill" href="/">
          Back to market index
        </Link>
      </div>
    </section>
  );
}

