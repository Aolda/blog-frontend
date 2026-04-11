import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toDateOnly } from "@/lib/date";
import { buildFrontmatterHeader } from "@/lib/frontmatter";
import type { PostResponse } from "@/types";
import { usePost, useSavePostContent, useAuthors } from "@/lib/queries";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Copy,
  Loader2,
  ImageIcon,
  PanelRightClose,
  Eye,
  Save,
  X,
  PenLine,
  Tag,
  ImagePlus,
  Type,
  AlignLeft,
  Users,
} from "lucide-react";
import ImagePanel from "@/components/image-panel";

interface EditSearch {
  postId?: number;
}

interface PostDraft {
  authors: string[];
  title: string;
  description: string;
  tags: string[];
  image: string;
  body: string;
}

const EMPTY_DRAFT: PostDraft = {
  authors: [],
  title: "",
  description: "",
  tags: [],
  image: "",
  body: "",
};

function createDraftFromPost(post: PostResponse): PostDraft {
  return {
    authors: [...post.authors],
    title: post.title ?? "",
    description: post.description ?? "",
    tags: [...post.tags],
    image: post.image ?? "",
    body: post.content ?? "",
  };
}

export const Route = createFileRoute("/_authenticated/edit")({
  beforeLoad: ({ search }) => {
    if (!search.postId) {
      throw redirect({ to: "/posts" });
    }
  },
  component: EditPage,
  validateSearch: (search: Record<string, unknown>): EditSearch => ({
    postId:
      typeof search.postId === "number"
        ? search.postId
        : typeof search.postId === "string"
          ? Number(search.postId) || undefined
          : undefined,
  }),
});

function EditPage() {
  const { postId } = Route.useSearch();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<PostDraft>(EMPTY_DRAFT);
  const [tagInput, setTagInput] = useState("");
  const [showImages, setShowImages] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [authorSearch, setAuthorSearch] = useState("");
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const authorSuggestionsRef = useRef<HTMLDivElement>(null);
  const initializedPostIdRef = useRef<number | null>(null);

  const { data: existingPost, isLoading: isLoadingPost, isError: isPostError } = usePost(postId ?? null);
  const savePostContent = useSavePostContent();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { data: allAuthors = [] } = useAuthors(0, 100);
  const postDate = existingPost ? toDateOnly(existingPost.created_at) : "";
  const { authors, title, description, tags, image, body } = draft;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (authorSuggestionsRef.current && !authorSuggestionsRef.current.contains(e.target as Node)) {
        setShowAuthorSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    initializedPostIdRef.current = null;
    setDraft(EMPTY_DRAFT);
    setTagInput("");
    setAuthorSearch("");
    setShowAuthorSuggestions(false);
    setShowImages(false);
    setActiveTab("edit");
  }, [postId]);

  useEffect(() => {
    if (!existingPost || existingPost.id === initializedPostIdRef.current) return;

    initializedPostIdRef.current = existingPost.id;
    setDraft(createDraftFromPost(existingPost));
    setTagInput("");
    setAuthorSearch("");
    setShowAuthorSuggestions(false);
  }, [existingPost]);

  const handleSave = () => {
    if (!postId) {
      toast.error("게시글이 아직 생성되지 않았습니다");
      return;
    }
    savePostContent.mutate(
      {
        postId,
        title: draft.title || null,
        description: draft.description || null,
        tags,
        image: draft.image || null,
        content: draft.body,
        authors,
      },
      {
        onSuccess: () => {
          toast.success("게시글이 저장되었습니다");
          navigate({ to: "/posts" });
        },
        onError: () => {
          toast.error("게시글 저장에 실패했습니다");
        },
      },
    );
  };

  const updateDraft = useCallback(<K extends keyof PostDraft>(key: K, value: PostDraft[K]) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeTag = useCallback((tagToRemove: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const addAuthor = useCallback(
    (username: string) => {
      if (authors.includes(username)) return;

      setDraft((prev) => ({
        ...prev,
        authors: [...prev.authors, username],
      }));
      setAuthorSearch("");
      setShowAuthorSuggestions(false);
    },
    [authors],
  );

  const removeAuthor = useCallback((username: string) => {
    setDraft((prev) => ({
      ...prev,
      authors: prev.authors.filter((author) => author !== username),
    }));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
          setDraft((prev) => ({
            ...prev,
            tags: [...prev.tags, trimmed],
          }));
          setTagInput("");
        } else if (trimmed && tags.includes(trimmed)) {
          toast.error("이미 존재하는 태그입니다");
          setTagInput("");
        }
      } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    },
    [tagInput, tags, removeTag],
  );

  const handleInsertImage = useCallback(
    (markdown: string) => {
      const textarea = bodyRef.current;
      if (!textarea) {
        setDraft((prev) => ({
          ...prev,
          body: prev.body + "\n" + markdown + "\n",
        }));
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(end);

      const needsNewlineBefore = before.length > 0 && !before.endsWith("\n");
      const needsNewlineAfter = after.length > 0 && !after.startsWith("\n");
      const insertion = (needsNewlineBefore ? "\n" : "") + markdown + (needsNewlineAfter ? "\n" : "");

      const newValue = before + insertion + after;
      updateDraft("body", newValue);

      requestAnimationFrame(() => {
        const newPos = before.length + insertion.length;
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      });
    },
    [updateDraft],
  );

  const handleBodyDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      const text = e.dataTransfer.getData("text/plain");
      if (text && text.startsWith("![")) {
        e.preventDefault();
        handleInsertImage(text);
      }
    },
    [handleInsertImage],
  );

  if (isLoadingPost) {
    return <LoadingState message="게시글 불러오는 중..." className="min-h-[60vh]" />;
  }

  if (isPostError || !existingPost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm text-destructive">게시글을 불러오지 못했습니다.</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/posts" })}>
          게시글 목록으로
        </Button>
      </div>
    );
  }

  const filteredAuthors = allAuthors.filter(
    (author) =>
      !authors.includes(author.username) &&
      (author.username.toLowerCase().includes(authorSearch.toLowerCase()) ||
        author.name.toLowerCase().includes(authorSearch.toLowerCase())),
  );

  const frontmatterHeader = buildFrontmatterHeader({
    date: postDate,
    authors,
    title,
    description,
    tags,
    image,
  });
  const fullContent = [frontmatterHeader, "", body].join("\n");
  const currentTitle = title || "제목 없음";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullContent);
      toast.success("클립보드에 복사되었습니다");
    } catch {
      toast.error("복사에 실패했습니다");
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center">
      <div className="flex h-full w-full max-w-5xl flex-col border-x">
        <header className="flex items-center justify-between border-b bg-background/95 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
              <PenLine className="size-4 text-primary" />
            </div>
            <div className="flex min-w-0 flex-col">
              <h1 className="truncate text-sm font-semibold leading-tight">
                {currentTitle === "제목 없음" ? "글 수정" : currentTitle}
              </h1>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">#{postId}</span>
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  편집 중
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowImages(!showImages)}>
                  {showImages ? <PanelRightClose className="size-4" /> : <ImageIcon className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{showImages ? "이미지 패널 닫기" : "이미지 패널"}</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5" />

            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              <Copy className="size-3.5" />
              <span className="hidden sm:inline">복사</span>
            </Button>

            <Button size="sm" onClick={handleSave} disabled={savePostContent.isPending} className="gap-1.5">
              {savePostContent.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              저장
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="border-b bg-muted/20">
              <div className="grid grid-cols-1 gap-4 px-5 py-3 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Type className="size-3" />
                      제목
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => updateDraft("title", e.target.value)}
                      placeholder="게시글 제목을 입력하세요"
                      className="h-8 bg-background text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <AlignLeft className="size-3" />
                      설명
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => updateDraft("description", e.target.value)}
                      placeholder="게시글에 대한 간략한 설명 (선택)"
                      className="min-h-12 resize-none bg-background text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Tag className="size-3" />
                      태그
                    </label>
                    <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-0.5 pr-0.5 text-[11px]">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 rounded-sm p-0.5 transition-colors hover:bg-destructive/20 hover:text-destructive"
                          >
                            <X className="size-2.5" />
                          </button>
                        </Badge>
                      ))}
                      <input
                        value={tagInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.includes(" ") || value.includes(",")) {
                            const trimmed = value.replace(/[,\s]/g, "").trim();
                            if (trimmed && !tags.includes(trimmed)) {
                              setDraft((prev) => ({
                                ...prev,
                                tags: [...prev.tags, trimmed],
                              }));
                            } else if (trimmed && tags.includes(trimmed)) {
                              toast.error("이미 존재하는 태그입니다");
                            }
                            setTagInput("");
                          } else {
                            setTagInput(value);
                          }
                        }}
                        onKeyDown={handleTagKeyDown}
                        placeholder={tags.length > 0 ? "" : "태그 입력 (Enter 또는 쉼표)"}
                        className="min-w-25 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5" ref={authorSuggestionsRef}>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Users className="size-3" />
                      작성자
                    </label>
                    <div className="relative flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5">
                      {authors.map((username) => (
                        <Badge key={username} variant="secondary" className="gap-0.5 text-[11px]">
                          {username}
                          <button
                            type="button"
                            onClick={() => removeAuthor(username)}
                            className="ml-0.5 rounded-sm p-0.5 transition-colors hover:bg-destructive/20 hover:text-destructive"
                          >
                            <X className="size-2.5" />
                          </button>
                        </Badge>
                      ))}
                      <input
                        value={authorSearch}
                        onChange={(e) => {
                          setAuthorSearch(e.target.value);
                          setShowAuthorSuggestions(true);
                        }}
                        onFocus={() => setShowAuthorSuggestions(true)}
                        placeholder={authors.length > 0 ? "" : "작성자 검색..."}
                        className="min-w-25 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      />
                      {showAuthorSuggestions && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                          {filteredAuthors.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground">검색 결과 없음</div>
                          ) : (
                            filteredAuthors.map((author) => (
                              <button
                                key={author.username}
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                                onClick={() => addAuthor(author.username)}
                              >
                                <span className="font-medium">{author.username}</span>
                                {author.name !== author.username && (
                                  <span className="text-xs text-muted-foreground">({author.name})</span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <ImagePlus className="size-3" />
                      커버 이미지
                    </label>
                    <Input
                      value={image}
                      onChange={(e) => updateDraft("image", e.target.value)}
                      placeholder="이미지 URL (선택)"
                      className="h-8 bg-background text-sm"
                    />
                    {image && (
                      <div className="mt-1 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={image}
                          alt="커버 이미지 미리보기"
                          className="h-40 w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex items-center justify-between border-b px-4 py-1.5">
                <TabsList variant="line" className="h-8 bg-transparent p-0">
                  <TabsTrigger value="edit" className="gap-1.5 px-3 py-1.5 text-xs">
                    <PenLine className="size-3" />
                    편집
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1.5 px-3 py-1.5 text-xs">
                    <Eye className="size-3" />
                    미리보기
                  </TabsTrigger>
                </TabsList>
                <span className="text-[10px] text-muted-foreground/50">
                  {body.length > 0 ? `${body.length.toLocaleString()}자` : ""}
                </span>
              </div>

              <TabsContent value="edit" className="m-0 min-h-0 flex-1">
                <Textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => updateDraft("body", e.target.value)}
                  onDrop={handleBodyDrop}
                  className="h-full flex-1 resize-none rounded-none border-0 p-5 font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
                  placeholder="여기에 MDX 본문을 작성하세요..."
                />
              </TabsContent>

              <TabsContent value="preview" className="m-0 min-h-0 flex-1 overflow-y-auto">
                <div className="p-5">
                  <pre className="whitespace-pre-wrap wrap-break-word font-mono text-[13px] leading-relaxed text-foreground/90">
                    {fullContent.trim() || <span className="italic text-muted-foreground">내용이 비어 있습니다</span>}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {showImages && (
            <>
              <Separator orientation="vertical" />
              <aside className="hidden w-72 flex-col border-l bg-muted/10 md:flex xl:w-80">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">이미지</span>
                  </div>
                  <Button variant="ghost" size="icon-xs" onClick={() => setShowImages(false)}>
                    <PanelRightClose className="size-3" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden p-3">
                  <ImagePanel postId={postId ?? null} onInsert={handleInsertImage} />
                </div>
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
