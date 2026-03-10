import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { getDraft, createDraft, updateDraft, extractTitle } from "@/lib/drafts";
import api from "@/lib/api";
import type { PostTemplate } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Copy, FileText, Loader2, ImageIcon, PanelRightClose, Eye, EyeOff, Save, Check, Send } from "lucide-react";
import ImagePanel from "@/components/ImagePanel";
import { useSavePostContent } from "@/lib/queries";

interface WriteSearch {
  draftId?: string;
}

function isRequestCanceled(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const e = error as { name?: string; code?: string };
  return e.name === "AbortError" || e.name === "CanceledError" || e.code === "ERR_CANCELED";
}

export const Route = createFileRoute("/write")({
  component: WritePage,
  validateSearch: (search: Record<string, unknown>): WriteSearch => ({
    draftId: typeof search.draftId === "string" ? search.draftId : undefined,
  }),
});

function WritePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { draftId } = Route.useSearch();
  const navigate = useNavigate();
  const hasInitialized = useRef(false);
  const templateRequestSeq = useRef(0);

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId ?? null);
  const [template, setTemplate] = useState<PostTemplate | null>(null);
  const [frontmatter, setFrontmatter] = useState("");
  const [body, setBody] = useState("");
  const [showImages, setShowImages] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [createTemplateError, setCreateTemplateError] = useState<string | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);

  const savePostContent = useSavePostContent();

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || hasInitialized.current) return;
    hasInitialized.current = true;

    if (draftId) {
      const existing = getDraft(draftId);
      if (existing) {
        setCurrentDraftId(existing.id);
        setFrontmatter(existing.frontmatter);
        setBody(existing.body);
        if (existing.postId) {
          setTemplate({
            post_id: existing.postId,
            author_name: "",
            created_at: existing.createdAt,
            frontmatter_example: existing.frontmatter,
          });
        }
        setIsCreatingTemplate(false);
        setCreateTemplateError(null);
        return;
      }
    }

    let isActive = true;
    const requestSeq = ++templateRequestSeq.current;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 15000);
    setIsCreatingTemplate(true);
    setCreateTemplateError(null);

    const initializeTemplate = async () => {
      try {
        const { data } = await api.post<PostTemplate>("/posts/template", undefined, { signal: controller.signal });
        if (!isActive || requestSeq !== templateRequestSeq.current) return;
        setTemplate(data);
        setFrontmatter(data.frontmatter_example);
        const draft = createDraft({
          postId: data.post_id,
          frontmatter: data.frontmatter_example,
          body: "",
        });
        setCurrentDraftId(draft.id);
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
  }, [isAuthenticated, draftId, retrySeed]);

  const persistDraft = useCallback(
    (fm: string, bd: string) => {
      if (!currentDraftId) return;
      setSaveState("saving");
      updateDraft(currentDraftId, { frontmatter: fm, body: bd });
      setTimeout(() => {
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }, 300);
    },
    [currentDraftId],
  );

  const scheduleAutoSave = useCallback(
    (fm: string, bd: string) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => persistDraft(fm, bd), 1500);
    },
    [persistDraft],
  );

  const handleFrontmatterChange = (value: string) => {
    setFrontmatter(value);
    scheduleAutoSave(value, body);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    scheduleAutoSave(frontmatter, value);
  };

  const handleManualSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    persistDraft(frontmatter, body);
    toast.success("임시저장 완료");
  };

  const handlePublish = () => {
    if (!template) {
      toast.error("게시글이 아직 생성되지 않았습니다");
      return;
    }
    const content = frontmatter + "\n" + body;
    savePostContent.mutate(
      { postId: template.post_id, content },
      {
        onSuccess: () => {
          toast.success("게시글이 저장되었습니다");
        },
        onError: () => {
          toast.error("게시글 저장에 실패했습니다");
        },
      },
    );
  };

  const handleInsertImage = useCallback(
    (markdown: string) => {
      const textarea = bodyRef.current;
      if (!textarea) {
        setBody((prev) => {
          const next = prev + "\n" + markdown + "\n";
          scheduleAutoSave(frontmatter, next);
          return next;
        });
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
      scheduleAutoSave(frontmatter, newValue);

      requestAnimationFrame(() => {
        const newPos = before.length + insertion.length;
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      });
    },
    [frontmatter, scheduleAutoSave],
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

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const fullContent = frontmatter + "\n" + body;
  const currentTitle = extractTitle(frontmatter);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullContent);
      toast.success("클립보드에 복사되었습니다");
    } catch {
      toast.error("복사에 실패했습니다");
    }
  };

  if (isCreatingTemplate && !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">템플릿 생성 중...</p>
      </div>
    );
  }

  if (createTemplateError && !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">{createTemplateError}</p>
        <Button
          variant="outline"
          onClick={() => {
            hasInitialized.current = false;
            setTemplate(null);
            setCreateTemplateError(null);
            setRetrySeed((prev) => prev + 1);
          }}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="size-5 shrink-0 text-primary" />
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {currentTitle === "제목 없음" ? "새 글 작성" : currentTitle}
          </h1>
          {template && (
            <Badge variant="secondary" className="shrink-0 font-mono text-xs">
              #{template.post_id}
            </Badge>
          )}
          {saveState === "saving" && (
            <span className="shrink-0 text-[11px] text-muted-foreground animate-pulse">저장 중...</span>
          )}
          {saveState === "saved" && (
            <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-emerald-600">
              <Check className="size-3" />
              저장됨
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={handleManualSave}>
                <Save className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>임시저장 (수동)</TooltipContent>
          </Tooltip>

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
            onClick={handlePublish}
            disabled={savePostContent.isPending || !template}
            className="gap-1.5"
          >
            {savePostContent.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            발행
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex flex-1 flex-col overflow-hidden ${showPreview ? "lg:flex-row" : ""}`}>
          <div className={`flex flex-col overflow-y-auto ${showPreview ? "lg:w-1/2 lg:border-r" : ""}`}>
            <div className="border-b">
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Frontmatter</span>
              </div>
              <Textarea
                value={frontmatter}
                onChange={(e) => handleFrontmatterChange(e.target.value)}
                className="rounded-none border-0 border-t font-mono text-sm shadow-none focus-visible:ring-0 min-h-[120px] resize-none"
                placeholder="---&#10;title: ''&#10;---"
              />
            </div>

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
                onChange={(e) => handleBodyChange(e.target.value)}
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
                <ImagePanel postId={template?.post_id ?? null} onInsert={handleInsertImage} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
