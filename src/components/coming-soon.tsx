type ComingSoonProps = {
  title: string;
  phase?: string;
  children?: React.ReactNode;
};

/** Placeholder body for routes that are built in a later phase. */
export function ComingSoon({ title, phase, children }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <div className="mt-4 text-muted-foreground">
        {children ?? (
          <p>
            This section is under construction and will be available in a later
            development phase.
          </p>
        )}
      </div>
      {phase ? (
        <p className="mt-6 inline-block rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Planned: {phase}
        </p>
      ) : null}
    </div>
  );
}
