import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import api from "@/lib/api";
import type { PostTemplate } from "@/types";
import { usePost, useSavePostContent, useAuthors } from "@/lib/queries";
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
import ImagePanel from "@/components/ImagePanel";

interface WriteSearch {
  postId?: number;
}

function isRequestCanceled(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const e = error as { name?: string; code?: string };
  return e.name === "AbortError" || e.name === "CanceledError" || e.code === "ERR_CANCELED";
}

function formatYamlString(value: string): string {
  return JSON.stringify(value);
}

function formatYamlArray(values: string[]): string {
  return `[${values.map((value) => formatYamlString(value)).join(", ")}]`;
}

function toPostDate(createdAt: string): string {
  return createdAt.split("T")[0];
}

function buildFullContent(metadata: {
  date: string;
  authors: string[];
  title: string;
  description: string;
  tags: string[];
  image: string;
  body: string;
}): string {
  return [
    "---",
    `title: ${formatYamlString(metadata.title)}`,
    `description: ${formatYamlString(metadata.description)}`,
    `date: ${metadata.date}`,
    `tags: ${formatYamlArray(metadata.tags)}`,
    `image: ${formatYamlString(metadata.image)}`,
    `author: ${formatYamlArray(metadata.authors)}`,
    "---",
    "",
    metadata.body,
  ].join("\n");
}

export const Route = createFileRoute("/write")({
  component: WritePage,
  validateSearch: (search: Record<string, unknown>): WriteSearch => ({
    postId:
      typeof search.postId === "number"
        ? search.postId
        : typeof search.postId === "string"
          ? Number(search.postId) || undefined
          : undefined,
  }),
});

function WritePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { postId: editPostId } = Route.useSearch();
  const navigate = useNavigate();

  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [postDate, setPostDate] = useState("");
  const [authors, setAuthors] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [image, setImage] = useState("");
  const [body, setBody] = useState("");
  const [showImages, setShowImages] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [createTemplateError, setCreateTemplateError] = useState<string | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);
  const [authorSearch, setAuthorSearch] = useState("");
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const authorSuggestionsRef = useRef<HTMLDivElement>(null);

  const isEditMode = editPostId !== undefined;
  const {
    data: existingPost,
    isLoading: isLoadingPost,
    isError: isPostError,
  } = usePost(isEditMode ? editPostId : null);

  const savePostContent = useSavePostContent();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { data: allAuthors = [] } = useAuthors(0, 100);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

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
    if (!isEditMode || !existingPost) return;

    setActivePostId(existingPost.id);
    setPostDate(toPostDate(existingPost.created_at));
    setAuthors(existingPost.authors);
    setTitle(existingPost.title ?? "");
    setDescription(existingPost.description ?? "");
    setTags(existingPost.tags);
    setImage(existingPost.image ?? "");
    setBody(existingPost.content ?? "");
    setAuthorSearch("");
    setShowAuthorSuggestions(false);
  }, [isEditMode, existingPost]);

  useEffect(() => {
    if (isEditMode) return;
    if (!isAuthenticated) return;

    let isActive = true;
    const controller = new AbortController();
    let abortTimeoutId: number | null = null;

    setActivePostId(null);
    setPostDate("");
    setAuthors([]);
    setTitle("");
    setDescription("");
    setTags([]);
    setImage("");
    setBody("");
    setAuthorSearch("");
    setShowAuthorSuggestions(false);
    setIsCreatingTemplate(true);
    setCreateTemplateError(null);

    const requestStartId = window.setTimeout(() => {
      abortTimeoutId = window.setTimeout(() => controller.abort(), 15000);

      void api
        .post<PostTemplate>("/posts/template", undefined, {
          signal: controller.signal,
        })
        .then(({ data }) => {
          if (!isActive) return;
          setActivePostId(data.post_id);
          setPostDate(toPostDate(data.created_at));
          setAuthors(data.author_names);
        })
        .catch((error) => {
          if (!isActive) return;
          setCreateTemplateError(
            isRequestCanceled(error)
              ? "요청이 지연되어 템플릿 생성을 중단했습니다. 다시 시도해주세요."
              : "템플릿 생성에 실패했습니다.",
          );
        })
        .finally(() => {
          if (abortTimeoutId !== null) {
            window.clearTimeout(abortTimeoutId);
          }
          if (!isActive) return;
          setIsCreatingTemplate(false);
        });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(requestStartId);
      if (abortTimeoutId !== null) {
        window.clearTimeout(abortTimeoutId);
      }
      controller.abort();
    };
  }, [isAuthenticated, retrySeed, isEditMode]);

  const handleSave = () => {
    if (!activePostId) {
      toast.error("게시글이 아직 생성되지 않았습니다");
      return;
    }
    savePostContent.mutate(
      {
        postId: activePostId,
        title: title || null,
        description: description || null,
        tags,
        image: image || null,
        content: body,
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

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }, []);

  const addAuthor = useCallback(
    (username: string) => {
      if (authors.includes(username)) return;
      setAuthors((prev) => [...prev, username]);
      setAuthorSearch("");
      setShowAuthorSuggestions(false);
    },
    [authors],
  );

  const removeAuthor = useCallback((username: string) => {
    setAuthors((prev) => prev.filter((author) => author !== username));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
          setTags((prev) => [...prev, trimmed]);
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

  const handleInsertImage = useCallback((markdown: string) => {
    const textarea = bodyRef.current;
    if (!textarea) {
      setBody((prev) => prev + "\n" + markdown + "\n");
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
    setBody(newValue);

    requestAnimationFrame(() => {
      const newPos = before.length + insertion.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    });
  }, []);

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

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (isEditMode && isLoadingPost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">게시글 불러오는 중...</p>
      </div>
    );
  }

  if (isEditMode && isPostError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm text-destructive">게시글을 불러오지 못했습니다.</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/posts" })}>
          게시글 목록으로
        </Button>
      </div>
    );
  }

  if (!isEditMode && isCreatingTemplate && !activePostId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">템플릿 생성 중...</p>
      </div>
    );
  }

  if (!isEditMode && createTemplateError && !activePostId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm text-destructive">{createTemplateError}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setActivePostId(null);
            setCreateTemplateError(null);
            setRetrySeed((prev) => prev + 1);
          }}
        >
          다시 시도
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

  const fullContent = buildFullContent({
    date: postDate,
    authors,
    title,
    description,
    tags,
    image,
    body,
  });
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
      <div className="flex flex-col w-full max-w-5xl h-full border-x">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
              <PenLine className="size-4 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight">
                {isEditMode ? "글 수정" : currentTitle === "제목 없음" ? "새 글 작성" : currentTitle}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                {activePostId && <span className="text-[11px] text-muted-foreground font-mono">#{activePostId}</span>}
                {isEditMode && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    편집 중
                  </Badge>
                )}
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

            <Button
              size="sm"
              onClick={handleSave}
              disabled={savePostContent.isPending || !activePostId}
              className="gap-1.5"
            >
              {savePostContent.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              저장
            </Button>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* 메타데이터 섹션 */}
            <div className="border-b bg-muted/20">
              <div className="px-5 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 왼쪽: 제목 + 설명 */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Type className="size-3" />
                      제목
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="게시글 제목을 입력하세요"
                      className="text-sm h-8 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <AlignLeft className="size-3" />
                      설명
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="게시글에 대한 간략한 설명 (선택)"
                      className="text-sm min-h-[52px] resize-none bg-background"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Tag className="size-3" />
                      태그
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 border rounded-md bg-background min-h-8">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-0.5 pr-0.5 text-[11px]">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 p-0.5 rounded-sm hover:bg-destructive/20 hover:text-destructive transition-colors"
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
                              setTags((prev) => [...prev, trimmed]);
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
                        className="flex-1 min-w-[100px] text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 커버 이미지 + 작성자 */}
                <div className="space-y-3">
                  <div className="space-y-1.5" ref={authorSuggestionsRef}>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Users className="size-3" />
                      작성자
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 border rounded-md bg-background min-h-8 relative">
                      {authors.map((username) => (
                        <Badge key={username} variant="secondary" className="gap-0.5 text-[11px]">
                          {username}
                          <button
                            type="button"
                            onClick={() => removeAuthor(username)}
                            className="ml-0.5 p-0.5 rounded-sm hover:bg-destructive/20 hover:text-destructive transition-colors"
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
                        className="flex-1 min-w-25 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
                      />
                      {showAuthorSuggestions && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-50 border rounded-md bg-popover shadow-md max-h-48 overflow-y-auto">
                          {filteredAuthors.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground">검색 결과 없음</div>
                          ) : (
                            filteredAuthors.map((author) => (
                              <button
                                key={author.username}
                                type="button"
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                                onClick={() => addAuthor(author.username)}
                              >
                                <span className="font-medium">{author.username}</span>
                                {author.name !== author.username && (
                                  <span className="text-muted-foreground text-xs">({author.name})</span>
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
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="이미지 URL (선택)"
                      className="text-sm h-8 bg-background"
                    />
                    {image && (
                      <div className="mt-1 rounded-md overflow-hidden border bg-muted">
                        <img
                          src={image}
                          alt="커버 이미지 미리보기"
                          className="w-full h-40 object-cover"
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

            {/* 에디터/미리보기 탭 */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center justify-between border-b px-4 py-1.5">
                <TabsList variant="line" className="h-8 bg-transparent p-0">
                  <TabsTrigger value="edit" className="text-xs px-3 py-1.5 gap-1.5">
                    <PenLine className="size-3" />
                    편집
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs px-3 py-1.5 gap-1.5">
                    <Eye className="size-3" />
                    미리보기
                  </TabsTrigger>
                </TabsList>
                <span className="text-[10px] text-muted-foreground/50">
                  {body.length > 0 ? `${body.length.toLocaleString()}자` : ""}
                </span>
              </div>

              <TabsContent value="edit" className="flex-1 m-0">
                <Textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onDrop={handleBodyDrop}
                  className="flex-1 h-full rounded-none border-0 font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-0 resize-none p-5"
                  placeholder="여기에 MDX 본문을 작성하세요..."
                />
              </TabsContent>

              <TabsContent value="preview" className="flex-1 m-0 overflow-y-auto">
                <div className="p-5">
                  <pre className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                    {fullContent.trim() || <span className="text-muted-foreground italic">내용이 비어 있습니다</span>}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 이미지 패널 */}
          {showImages && (
            <>
              <Separator orientation="vertical" />
              <aside className="hidden md:flex w-72 xl:w-80 flex-col border-l bg-muted/10">
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
                  <ImagePanel postId={activePostId} onInsert={handleInsertImage} />
                </div>
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
