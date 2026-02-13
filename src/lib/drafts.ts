const STORAGE_KEY = "blog-drafts";

export interface Draft {
  id: string;
  postId: number | null;
  title: string;
  frontmatter: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function loadDrafts(): Draft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: Draft[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function getDraft(id: string): Draft | null {
  return loadDrafts().find((d) => d.id === id) ?? null;
}

export function createDraft(fields: Pick<Draft, "postId" | "frontmatter" | "body">): Draft {
  const now = new Date().toISOString();
  const draft: Draft = {
    id: generateId(),
    postId: fields.postId,
    title: extractTitle(fields.frontmatter),
    frontmatter: fields.frontmatter,
    body: fields.body,
    createdAt: now,
    updatedAt: now,
  };
  const drafts = loadDrafts();
  drafts.unshift(draft);
  saveDrafts(drafts);
  return draft;
}

export function updateDraft(id: string, fields: Partial<Pick<Draft, "frontmatter" | "body">>): Draft | null {
  const drafts = loadDrafts();
  const idx = drafts.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  const draft = drafts[idx];
  if (fields.frontmatter !== undefined) {
    draft.frontmatter = fields.frontmatter;
    draft.title = extractTitle(fields.frontmatter);
  }
  if (fields.body !== undefined) {
    draft.body = fields.body;
  }
  draft.updatedAt = new Date().toISOString();
  drafts[idx] = draft;
  saveDrafts(drafts);
  return draft;
}

export function deleteDraft(id: string): boolean {
  const drafts = loadDrafts();
  const filtered = drafts.filter((d) => d.id !== id);
  if (filtered.length === drafts.length) return false;
  saveDrafts(filtered);
  return true;
}

export function extractTitle(frontmatter: string): string {
  const match = frontmatter.match(/title:\s*['"]?(.*?)['"]?\s*$/m);
  return match?.[1]?.trim() || "제목 없음";
}
