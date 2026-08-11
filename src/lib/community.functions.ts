import { createServerFn } from "@tanstack/react-start";

interface GhCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  slug: string;
}

interface GhDiscussion {
  id: string;
  number: number;
  title: string;
  author: { login: string };
  createdAt: string;
  isAnswered: boolean;
  upvoteCount: number;
  bodyText: string;
}

const REPO_INPUT = (input: { owner: string; name: string }) => ({
  owner: String(input.owner ?? "").trim(),
  name: String(input.name ?? "").trim(),
});

async function gh<T>(query: string, variables: Record<string, any>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { ok: false, error: "GITHUB_TOKEN is not configured. Add it in the backend secrets to load discussions." };

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `GitHub API error: ${res.status} - ${text}` };
    }

    const json = await res.json();
    if (json.errors) {
      return { ok: false, error: `GraphQL error: ${json.errors[0].message}` };
    }

    return { ok: true, data: json.data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export const fetchRepoMeta = createServerFn({ method: "POST" })
  .validator(REPO_INPUT)
  .handler(async ({ data }) => {
    const r = await gh<{ repository: { id: string; hasDiscussionsEnabled: boolean; discussionCategories: { nodes: GhCategory[] } } | null }>(
      `query($owner:String!,$name:String!){
        repository(owner:$owner,name:$name){
          id
          hasDiscussionsEnabled
          discussionCategories(first:25){ nodes { id name emoji description slug } }
        }
      }`,
      data
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
  .validator((input: { owner: string; name: string; categoryId?: string | null; limit?: number }) => ({
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
              id
              number
              title
              author { login }
              createdAt
              isAnswered
              upvoteCount
              bodyText
            }
          }
        }
      }`,
      data
    );
    if (!r.ok) return { ok: false as const, error: r.error, discussions: [] as GhDiscussion[], totalCount: 0 };
    const d = r.data.repository?.discussions;
    return { ok: true as const, error: null, discussions: d?.nodes ?? [], totalCount: d?.totalCount ?? 0 };
  });

export const fetchDiscussion = createServerFn({ method: "POST" })
  .validator((input: { owner: string; name: string; number: number }) => ({
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
            id
            number
            title
            author { login }
            createdAt
            isAnswered
            upvoteCount
            bodyText
            body
            answer { id }
          }
        }
      }`,
      data
    );
    if (!r.ok) return { ok: false as const, error: r.error, discussion: null };
    return { ok: true as const, error: null, discussion: r.data.repository?.discussion ?? null };
  });
