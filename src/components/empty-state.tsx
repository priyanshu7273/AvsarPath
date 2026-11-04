type EmptyStateProps = {
  /** Honest message — we never show fake counts or placeholder listings. */
  message?: string;
};

export function EmptyState({
  message = "No opportunities published yet. Verified listings will appear here.",
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
