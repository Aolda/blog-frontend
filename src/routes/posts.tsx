import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { toDateOnly } from "@/lib/date";
import { usePosts, useDeletePost } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus, Clock, Eye, ChevronLeft, ChevronRight, Loader2, PenSquare, Trash2, Users } from "lucide-react";

interface PostsSearch {
  page?: number;
}

export const Route = createFileRoute("/posts")({
  component: PostsPage,
  validateSearch: (search: Record<string, unknown>): PostsSearch => ({
    page:
      typeof search.page === "number" ? search.page : typeof search.page === "string" ? Number(search.page) || 1 : 1,
  }),
});

const PAGE_SIZE = 20;

function PostsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { page = 1 } = Route.useSearch();
  const { data: posts = [], isLoading, isError } = usePosts(page, PAGE_SIZE);
  const deletePost = useDeletePost();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
            <FileText className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">게시글</h1>
            <p className="text-sm text-muted-foreground mt-0.5">블로그 게시글을 관리합니다</p>
          </div>
        </div>
        <Button asChild>
          <Link to="/write">
            <Plus className="size-4" /> 새 글 작성
          </Link>
        </Button>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">게시글을 불러오는 중...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <FileText className="size-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium">게시글을 불러오는 데 실패했습니다</p>
          <p className="text-sm text-muted-foreground mt-1">네트워크 연결을 확인해주세요</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate({ to: "/posts", search: { page } })}>
            다시 시도
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="size-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">게시글이 없습니다</p>
          <p className="text-sm text-muted-foreground/70 mt-1">첫 번째 게시글을 작성해보세요</p>
          <Button variant="outline" className="mt-6" asChild>
            <Link to="/write">새 글 작성하기</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => {
            const title = post.title ?? "제목 없음";
            const description = post.description ?? "";
            const tags = post.tags;
            const date = toDateOnly(post.created_at);
            const authors = post.authors;

            return (
              <Card
                key={post.id}
                className="group relative transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1">
                        <CardTitle className="text-base leading-tight">
                          <Link
                            to="/write"
                            search={{ postId: post.id }}
                            className="hover:text-primary transition-colors line-clamp-1"
                          >
                            {title}
                          </Link>
                        </CardTitle>
                        <Badge variant="outline" className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          #{post.id}
                        </Badge>
                      </div>
                      {description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                          {description}
                        </p>
                      )}
                    </div>
                    {post.can_edit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link to="/write" search={{ postId: post.id }}>
                            <PenSquare className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:text-destructive"
                          onClick={() => setDeletingId(post.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {tags.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[11px] px-2 py-0.5 font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div />
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        {authors.join(", ")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="size-3.5" />
                        {post.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {posts.length > 0 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate({ to: "/posts", search: { page: page - 1 } })}
            className="gap-1.5"
          >
            <ChevronLeft className="size-4" />
            이전
          </Button>
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm font-medium text-foreground">{page}</span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">페이지</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={posts.length < PAGE_SIZE}
            onClick={() => navigate({ to: "/posts", search: { page: page + 1 } })}
            className="gap-1.5"
          >
            다음
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <Dialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시글 삭제</DialogTitle>
            <DialogDescription>정말 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={deletePost.isPending}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={deletePost.isPending}
              onClick={() => {
                if (deletingId !== null) {
                  deletePost.mutate(deletingId, {
                    onSuccess: () => setDeletingId(null),
                  });
                }
              }}
            >
              {deletePost.isPending && <Loader2 className="size-4 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
