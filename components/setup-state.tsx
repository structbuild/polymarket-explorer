type SetupStateProps = {
  title: string;
  description: string;
};

const requiredEnv = [
  {
    name: "STRUCTBUILD_API_KEY",
    description: "Private server-side credential passed into StructClient.",
  },
  {
    name: "STRUCTBUILD_TIMEOUT_MS",
    description: "Optional request timeout for SDK calls. Defaults to 10000.",
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    description: "Canonical site URL used for metadata, robots, and sitemap.",
  },
];

export function SetupState({
  title,
  description,
}: Readonly<SetupStateProps>) {
  return (
    <section className="status-card">
      <h2>{title}</h2>
      <p className="status-copy">{description}</p>
      <div className="env-list">
        {requiredEnv.map((env) => (
          <div className="env-item" key={env.name}>
            <strong className="mono">{env.name}</strong>
            <span>{env.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

