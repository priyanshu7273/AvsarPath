import { addPost, deletePost } from "@/app/admin/actions";
import type { AdminPost } from "@/lib/admin.server";
import { sumPostVacancies } from "@/lib/opportunities";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary";
const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

/**
 * Add / list / remove posts (roles) for an opportunity. Posts are the source of
 * truth for vacancy counts. Plain Server Action forms — no client JS required.
 */
export function PostsEditor({
  opportunityId,
  posts,
}: {
  opportunityId: string;
  posts: AdminPost[];
}) {
  const total = sumPostVacancies(posts);

  return (
    <section id="posts" className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Posts &amp; vacancies</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Each role with its own vacancy count. The public total is the sum of these; the
        opportunity-level total is used only when there are no posts.
      </p>

      {posts.length > 0 ? (
        <>
          <ul className="mt-4 space-y-3">
            {posts.map((p) => (
              <li key={p.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {p.name}
                      {typeof p.vacancies === "number" ? (
                        <span className="text-muted-foreground"> · {p.vacancies} vacancies</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[p.department, p.payLevel, p.ageLimit].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {p.eligibility ? (
                      <p className="mt-1 text-xs text-muted-foreground">{p.eligibility}</p>
                    ) : null}
                  </div>
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={opportunityId} />
                    <input type="hidden" name="post_id" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-red-500/50 hover:text-red-600 dark:hover:text-red-400"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-medium text-foreground">
            Total vacancies: {total === null ? "—" : total.toLocaleString("en-IN")}
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No posts yet.</p>
      )}

      <form action={addPost} className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
        <input type="hidden" name="id" value={opportunityId} />
        <label className="block sm:col-span-2">
          <span className={labelClass}>
            Post name<span className="text-primary"> *</span>
          </span>
          <input name="post_name" type="text" required placeholder="e.g. Lower Division Clerk" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Department</span>
          <input name="post_department" type="text" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Vacancies</span>
          <input name="post_vacancies" type="number" min="0" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Pay level / salary</span>
          <input name="post_pay_level" type="text" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Age limit</span>
          <input name="post_age_limit" type="text" className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Eligibility</span>
          <input name="post_eligibility" type="text" className={inputClass} />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
          >
            Add post
          </button>
        </div>
      </form>
    </section>
  );
}
