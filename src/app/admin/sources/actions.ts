"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { ingestAllActive, ingestSource } from "@/lib/ingest.server";
import { SOURCE_ACCESS_METHODS, SOURCE_STATUSES } from "@/lib/ingest";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function parseSource(formData: FormData): Record<string, unknown> | { error: string } {
  const name = str(formData, "source_name");
  if (!name) return { error: "A source name is required." };

  const method = str(formData, "access_method") ?? "rss";
  if (!(SOURCE_ACCESS_METHODS as readonly string[]).includes(method)) {
    return { error: "Choose a valid access method." };
  }

  const status = str(formData, "source_status") ?? "active";
  if (!(SOURCE_STATUSES as readonly string[]).includes(status)) {
    return { error: "Choose a valid status." };
  }

  const feedUrl = str(formData, "feed_url");
  const sourceUrl = str(formData, "source_url");
  if (method === "rss" && !feedUrl && !sourceUrl) {
    return { error: "An RSS/Atom source needs a feed URL (or a site URL to fetch)." };
  }

  return {
    source_name: name,
    access_method: method,
    source_status: status,
    feed_url: feedUrl,
    source_url: sourceUrl,
    notes: str(formData, "notes"),
  };
}

export async function createSource(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/sources");
  const parsed = parseSource(formData);
  if ("error" in parsed) return parsed;

  const sb = adminClient();
  // source_url is NOT NULL unique in the schema; fall back to the feed URL.
  const payload = { ...parsed, source_url: parsed.source_url ?? parsed.feed_url };
  const { data, error } = await sb.from("content_sources").insert(payload).select("id").single();
  if (error || !data) {
    return { error: `Could not create the source: ${error?.message ?? "unknown error"}` };
  }

  revalidatePath("/admin/sources");
  redirect(`/admin/sources/${data.id as string}?saved=1`);
}

export async function updateSource(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("/admin/sources");
  const id = str(formData, "id");
  if (!id) return { error: "Missing source id." };

  const parsed = parseSource(formData);
  if ("error" in parsed) return parsed;

  const sb = adminClient();
  const payload = { ...parsed, source_url: parsed.source_url ?? parsed.feed_url };
  const { error } = await sb.from("content_sources").update(payload).eq("id", id);
  if (error) return { error: `Could not save: ${error.message}` };

  revalidatePath("/admin/sources");
  revalidatePath(`/admin/sources/${id}`);
  redirect(`/admin/sources/${id}?saved=1`);
}

export async function fetchSourceNow(formData: FormData): Promise<void> {
  await requireAdmin("/admin/sources");
  const id = str(formData, "id");
  if (!id) return;

  await ingestSource(id);

  revalidatePath("/admin/sources");
  revalidatePath(`/admin/sources/${id}`);
  revalidatePath("/admin/review");
  redirect(`/admin/sources/${id}?ran=1`);
}

export async function fetchAllNow(): Promise<void> {
  await requireAdmin("/admin/sources");
  await ingestAllActive();

  revalidatePath("/admin/sources");
  revalidatePath("/admin/review");
  redirect("/admin/sources?ran=all");
}

export async function deleteSource(formData: FormData): Promise<void> {
  await requireAdmin("/admin/sources");
  const id = str(formData, "id");
  if (!id) return;

  const sb = adminClient();
  // Cascades this source's staged items and runs; imported opportunities remain.
  await sb.from("content_sources").delete().eq("id", id);

  revalidatePath("/admin/sources");
  revalidatePath("/admin/review");
  redirect("/admin/sources?deleted=1");
}

export async function dismissItem(formData: FormData): Promise<void> {
  await requireAdmin("/admin/review");
  const itemId = str(formData, "item_id");
  if (!itemId) return;

  const sb = adminClient();
  await sb.from("source_items").update({ item_status: "dismissed" }).eq("id", itemId);

  revalidatePath("/admin/review");
  redirect("/admin/review");
}
