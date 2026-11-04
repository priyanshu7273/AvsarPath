import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          This policy will explain what personal information we collect, why we
          collect it, how it is used and stored, and how you can access, correct
          or delete your data — including deleting your account.
        </p>
        <p className="text-sm italic">
          Draft placeholder. The full policy will be reviewed against applicable
          Indian privacy requirements before commercial launch.
        </p>
      </div>
    </div>
  );
}
