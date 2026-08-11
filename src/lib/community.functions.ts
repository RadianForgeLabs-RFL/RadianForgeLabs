import { createServerFn } from "@tanstack/react-start";

type GhResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function gh<T>(query: string, variables: Record<string, unknown>): Promise<GhResult<T>> {
  const token = process.env["GITHUB_TOKEN"];
  if (!token) return { ok: false, error: "GITHUB_TOKEN is not configured. Add it in the backend secrets to load discussions." };
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "User-Agent": "RadianForgeLabs-Community",
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (!res.ok) return { ok: false, error: `GitHub request failed (${res.status})` };
    if (json.errors?.length) return { ok: false, error: json.errors.map((e) => e.message).join("; ") };
    return { ok: true, data: json.data as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error contacting GitHub" };
  }
}

export type GhCategory = { id: string; name: string; emoji: string | null; description: string | null; slug: string };
export type GhDiscussion = {
  id: string;
  number: number;
  title: string;
  createdAt: string;
  isAnswered: boolean | null;
  url: string;
  author: { login: string; avatarUrl: string } | null;
  category: { id: string; name: string; emoji: string | null } | null;
  comments: { totalCount: number };
  upvoteCount: number;
  bodyText: string;
};

const REPO_INPUT = (input: { owner: string; name: string }) => ({
  owner: String(input.owner ?? "").trim(),
  name: String(input.name ?? "").trim(),
});

export const fetchRepoMeta = createServerFn({ method: "POST" })
  .inputValidator(REPO_INPUT)
  .handler(async ({ data }) => {
    const r = await gh<{ repository: { id: string; hasDiscussionsEnabled: boolean; discussionCategories: { nodes: GhCategory[] } } | null }>(
      `query($owner:String!,$name:String!){
        repository(owner:$owner,name:$name){
          id
          hasDiscussionsEnabled
          discussionCategories(first:25){ nodes { id name emoji description slug } }
        }
      }`,
      data,
    );
    if (!r.ok) return { ok: false as const, error: r.error };
    if (!r.data.repository) return { ok: false as const, error: "Repository not found or not accessible with the configured token." };
    return {
      ok: true as const,
      repoId: r.data.repository.id,
      hasDiscussions: r.data.repository.hasDiscussionsEnabled,
      categories: r.data.repository.discussionCategories.nodes,
    };
  });

export const fetchDiscussions = createServerFn({ method: "POST" })
  .inputValidator((input: { owner: string; name: string; categoryId?: string | null; limit?: number }) => ({
    ...REPO_INPUT(input),
    categoryId: input.categoryId ?? null,
    limit: Math.min(Math.max(Number(input.limit ?? 20), 1), 50),
  }))
  .handler(async ({ data }) => {
    const r = await gh<{ repository: { discussions: { totalCount: number; nodes: GhDiscussion[] } } | null }>(
      `query($owner:String!,$name:String!,$categoryId:ID,$limit:Int!){
        repository(owner:$owner,name:$name){
          discussions(first:$limit, categoryId:$categoryId, orderBy:{field:UPDATED_AT, direction:DESC}){
            totalCount
            nodes {
              id number title createdAt isAnswered url upvoteCount bodyText
              author { login avatarUrl }
              category { id name emoji }
              comments { totalCount }
            }
          }
        }
      }`,
      data,
    );
    if (!r.ok) return { ok: false as const, error: r.error, discussions: [] as GhDiscussion[], totalCount: 0 };
    const d = r.data.repository?.discussions;
    return { ok: true as const, error: null, discussions: d?.nodes ?? [], totalCount: d?.totalCount ?? 0 };
  });

export const fetchDiscussion = createServerFn({ method: "POST" })
  .inputValidator((input: { owner: string; name: string; number: number }) => ({
    ...REPO_INPUT(input),
    number: Number(input.number),
  }))
  .handler(async ({ data }) => {
    const r = await gh<{
      repository: {
        discussion: (GhDiscussion & { body: string; answer: { id: string } | null }) | null;
      } | null;
    }>(
      `query($owner:String!,$name:String!,$number:Int!){
        repository(owner:$owner,name:$name){
          discussion(number:$number){
            id number title createdAt isAnswered url upvoteCount bodyText body
            author { login avatarUrl }
            category { id name emoji }
            comments { totalCount }
            answer { id }
          }
        }
      }`,
      data,
    );
    if (!r.ok) return { ok: false as const, error: r.error, discussion: null };
    return { ok: true as const, error: null, discussion: r.data.repository?.discussion ?? null };
  });
