import type { PostMeta } from "@/types";

/**
 * content 문자열에서 YAML frontmatter 블록과 본문을 분리합니다.
 *
 * content 형식:
 * ```
 * ---
 * title: 'Hello'
 * description: '...'
 * date: 2026-03-10
 * tags: [a, b]
 * image: ''
 * author: ['johndoe']
 * ---
 * 본문 내용
 * ```
 */
export function splitContent(content: string): {
  frontmatter: string;
  body: string;
} {
  // frontmatter 블록 감지: --- 로 시작하고 --- 로 닫히는 블록
  const match = content.match(/^(---\n[\s\S]*?\n---)\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: "", body: content };
  }
  return {
    frontmatter: match[1],
    body: match[2],
  };
}

/**
 * frontmatter 문자열(--- 포함)에서 메타데이터를 파싱합니다.
 * 완전한 YAML 파서가 아닌, 블로그 frontmatter에서 흔히 쓰이는 패턴만 처리합니다.
 */
export function parseFrontmatter(frontmatter: string): PostMeta {
  const meta: PostMeta = {
    title: "",
    description: "",
    date: "",
    tags: [],
    image: "",
    author: [],
  };

  // --- 제거
  const inner = frontmatter.replace(/^---\n?/, "").replace(/\n?---$/, "");

  const extractString = (key: string): string => {
    // key: 'value' 또는 key: "value" 또는 key: value
    const re = new RegExp(`^${key}:\\s*(['"]?)(.*?)\\1\\s*$`, "m");
    const m = inner.match(re);
    return m?.[2]?.trim() ?? "";
  };

  const extractArray = (key: string): string[] => {
    // key: ['a', 'b'] 또는 key: [a, b]
    const re = new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, "m");
    const m = inner.match(re);
    if (!m) return [];
    return m[1]
      .split(",")
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  };

  meta.title = extractString("title");
  meta.description = extractString("description");
  meta.date = extractString("date");
  meta.image = extractString("image");
  meta.tags = extractArray("tags");
  meta.author = extractArray("author");

  return meta;
}

/**
 * content 문자열에서 바로 메타데이터를 파싱합니다.
 */
export function parsePostMeta(content: string): PostMeta {
  const { frontmatter } = splitContent(content);
  return parseFrontmatter(frontmatter);
}
