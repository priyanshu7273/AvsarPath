import { signInWithProvider } from "@/app/login/actions";

/**
 * OAuth sign-in buttons. Each form submits a Server Action bound to its
 * provider, so no provider logic reaches the client.
 */
export function SignInButtons({ next }: { next?: string }) {
  return (
    <div className="space-y-3">
      <form action={signInWithProvider.bind(null, "github", next)}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Continue with GitHub
        </button>
      </form>
      <form action={signInWithProvider.bind(null, "google", next)}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
