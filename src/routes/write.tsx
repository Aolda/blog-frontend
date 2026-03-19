import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import api from "@/lib/api";
import type { PostTemplate } from "@/types";
import { usePost, useSavePostContent } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Copy, FileText, Loader2, ImageIcon, PanelRightClose, Eye, EyeOff, Save, X, Plus } from "lucide-react";
import ImagePanel from "@/components/ImagePanel";

interface WriteSearch {
  postId?: number;
}

interface FrontmatterContext {
  date: string;
  author: string[];
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

function buildFullContent(
  metadata: {
    title: string;
    description: string;
    tags: string[];
    image: string;
    body: string;
  },
  context: FrontmatterContext | null,
): string {
  if (!context) {
    return metadata.body;
  }

  return [
    "---",
    `title: ${formatYamlString(metadata.title)}`,
    `description: ${formatYamlString(metadata.description)}`,
    `date: ${context.date}`,
    `tags: ${formatYamlArray(metadata.tags)}`,
    `image: ${formatYamlString(metadata.image)}`,
    `author: ${formatYamlArray(context.author)}`,
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
  const hasInitialized = useRef(false);
  const templateRequestSeq = useRef(0);

  const [activePostId, setActivePostId] = useState<number | null>(editPostId ?? null);
  // 메타데이터 상태 (분리된 필드)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [image, setImage] = useState("");
  const [body, setBody] = useState("");
  const [frontmatterContext, setFrontmatterContext] = useState<FrontmatterContext | null>(null);
  const [showImages, setShowImages] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [createTemplateError, setCreateTemplateError] = useState<string | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);

  const isEditMode = editPostId !== undefined;
  const {
    data: existingPost,
    isLoading: isLoadingPost,
    isError: isPostError,
  } = usePost(isEditMode ? editPostId : null);

  const savePostContent = useSavePostContent();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // 편집 모드: 서버에서 기존 게시글 로드
  useEffect(() => {
    if (!isEditMode || !existingPost || hasInitialized.current) return;
    hasInitialized.current = true;

    setActivePostId(existingPost.id);
    setTitle(existingPost.title ?? "");
    setDescription(existingPost.description ?? "");
    setTags(existingPost.tags ?? []);
    setImage(existingPost.image ?? "");
    setBody(existingPost.content ?? "");
    setFrontmatterContext({
      date: existingPost.frontmatter.date,
      author: existingPost.frontmatter.author,
    });
  }, [isEditMode, existingPost]);

  // 새 글 작성 모드: 템플릿 생성
  useEffect(() => {
    if (isEditMode) return;
    if (!isAuthenticated || hasInitialized.current) return;
    hasInitialized.current = true;

    let isActive = true;
    const requestSeq = ++templateRequestSeq.current;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    setIsCreatingTemplate(true);
    setCreateTemplateError(null);

    const initializeTemplate = async () => {
      try {
        const { data } = await api.post<PostTemplate>("/posts/template", undefined, {
          signal: controller.signal,
        });
        if (!isActive || requestSeq !== templateRequestSeq.current) return;
        setActivePostId(data.post_id);
        // 메타데이터는 빈 값으로 초기화
        setTitle("");
        setDescription("");
        setTags([]);
        setImage("");
        setBody("");
        setFrontmatterContext({
          date: data.created_at,
          author: [data.author_name],
        });
      } catch (error) {
        if (!isActive || requestSeq !== templateRequestSeq.current) return;
        setCreateTemplateError(
          isRequestCanceled(error)
            ? "요청이 지연되어 템플릿 생성을 중단했습니다. 다시 시도해주세요."
            : "템플릿 생성에 실패했습니다.",
        );
      } finally {
        window.clearTimeout(timeoutId);
        if (isActive && requestSeq === templateRequestSeq.current) {
          setIsCreatingTemplate(false);
        }
      }
    };

    void initializeTemplate();

    return () => {
      isActive = false;
      hasInitialized.current = false;
      window.clearTimeout(timeoutId);
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

  // 태그 추가
  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      toast.error("이미 존재하는 태그입니다");
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  }, [tagInput, tags]);

  // 태그 삭제
  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }, []);

  // 태그 입력 키 핸들러
  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
    },
    [addTag],
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

  // 편집 모드: 기존 게시글 로딩 중
  if (isEditMode && isLoadingPost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">게시글 불러오는 중...</p>
      </div>
    );
  }

  // 편집 모드: 게시글 로딩 실패
  if (isEditMode && isPostError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">게시글을 불러오지 못했습니다.</p>
        <Button variant="outline" onClick={() => navigate({ to: "/posts" })}>
          게시글 목록으로
        </Button>
      </div>
    );
  }

  // 새 글 작성 모드: 템플릿 생성 중
  if (!isEditMode && isCreatingTemplate && !activePostId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">템플릿 생성 중...</p>
      </div>
    );
  }

  // 새 글 작성 모드: 템플릿 생성 실패
  if (!isEditMode && createTemplateError && !activePostId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">{createTemplateError}</p>
        <Button
          variant="outline"
          onClick={() => {
            hasInitialized.current = false;
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

  const fullContent = buildFullContent({ title, description, tags, image, body }, frontmatterContext);
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
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="size-5 shrink-0 text-primary" />
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {isEditMode ? "글 수정" : currentTitle === "제목 없음" ? "새 글 작성" : currentTitle}
          </h1>
          {activePostId && (
            <Badge variant="secondary" className="shrink-0 font-mono text-xs">
              #{activePostId}
            </Badge>
          )}
          {isEditMode && (
            <Badge variant="outline" className="shrink-0 text-[10px]">
              편집
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showPreview ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showPreview ? "미리보기 숨기기" : "미리보기"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showImages ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setShowImages(!showImages)}
              >
                {showImages ? <PanelRightClose className="size-4" /> : <ImageIcon className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showImages ? "이미지 패널 닫기" : "이미지 패널 열기"}</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="size-3.5" />
            복사
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={savePostContent.isPending || !activePostId}
            className="gap-1.5"
          >
            {savePostContent.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            저장하기
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex flex-1 flex-col overflow-hidden ${showPreview ? "lg:flex-row" : ""}`}>
          <div className={`flex flex-col overflow-y-auto ${showPreview ? "lg:w-1/2 lg:border-r" : ""}`}>
            {/* 메타데이터 폼 */}
            <div className="border-b">
              <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">메타데이터</span>
              </div>
              <div className="p-4 space-y-4">
                {/* 제목 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">제목</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="게시글 제목"
                    className="text-sm"
                  />
                </div>

                {/* 설명 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">설명</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="게시글 설명 (선택)"
                    className="text-sm min-h-[60px] resize-none"
                  />
                </div>

                {/* 태그 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">태그</label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="태그 입력 후 Enter"
                      className="text-sm flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* 커버 이미지 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">커버 이미지 URL</label>
                  <Input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="이미지 URL (선택)"
                    className="text-sm"
                  />
                  {image && (
                    <div className="mt-2 rounded-md overflow-hidden border">
                      <img
                        src={image}
                        alt="커버 이미지 미리보기"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 본문 */}
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2 px-4 py-2 border-b">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">본문 (MDX)</span>
                <span className="ml-auto text-[10px] text-muted-foreground/60">
                  이미지를 클릭하면 커서 위치에 삽입됩니다
                </span>
              </div>
              <Textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onDrop={handleBodyDrop}
                className="flex-1 rounded-none border-0 font-mono text-sm shadow-none focus-visible:ring-0 min-h-[300px] resize-none"
                placeholder="여기에 MDX 본문을 작성하세요..."
              />
            </div>
          </div>

          {showPreview && (
            <div className="hidden lg:flex lg:w-1/2 flex-col overflow-y-auto bg-muted/30">
              <div className="px-4 py-2 border-b">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">미리보기</span>
              </div>
              <pre className="flex-1 p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {fullContent.trim() || "(내용이 비어 있습니다)"}
              </pre>
            </div>
          )}
        </div>

        {showImages && (
          <>
            <Separator orientation="vertical" />
            <div className="hidden w-72 flex-col md:flex xl:w-80">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <ImageIcon className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">이미지</span>
                <Button variant="ghost" size="icon-xs" className="ml-auto" onClick={() => setShowImages(false)}>
                  <PanelRightClose className="size-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden p-3">
                <ImagePanel postId={activePostId} onInsert={handleInsertImage} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
