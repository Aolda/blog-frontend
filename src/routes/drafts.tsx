import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { loadDrafts, deleteDraft } from "@/lib/drafts";
import type { Draft } from "@/lib/drafts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Trash2, PenSquare, Plus, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/drafts")({ component: DraftsPage });

function DraftsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>(loadDrafts);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleDelete = (id: string) => {
    deleteDraft(id);
    setDrafts(loadDrafts());
    toast.success("임시저장 글이 삭제되었습니다");
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">임시저장</h1>
          <Badge variant="secondary">{drafts.length}개</Badge>
        </div>
        <Button size="sm" asChild>
          <Link to="/write">
            <Plus className="size-4" />새 글 작성
          </Link>
        </Button>
      </div>

      <Separator />

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="size-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">임시저장된 글이 없습니다</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/write">새 글 작성하기</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => {
            const bodyPreview = draft.body.trim().slice(0, 120) || "(본문 없음)";
            const updatedAt = new Date(draft.updatedAt);
            const isRecent = Date.now() - updatedAt.getTime() < 24 * 60 * 60 * 1000;

            return (
              <Card key={draft.id} className="group transition-colors hover:border-primary/30">
                <CardContent className="flex items-start gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to="/write" search={{ draftId: draft.id }} className="font-medium truncate hover:underline">
                        {draft.title}
                      </Link>
                      {draft.postId && (
                        <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                          #{draft.postId}
                        </Badge>
                      )}
                      {isRecent && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          최근
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{bodyPreview}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/70">
                      <Clock className="size-3" />
                      <time dateTime={draft.updatedAt}>
                        {updatedAt.toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {updatedAt.toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link to="/write" search={{ draftId: draft.id }}>
                        <PenSquare className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(draft.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
