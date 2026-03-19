import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { usePosts } from "@/lib/queries";
import { parsePostMeta } from "@/lib/frontmatter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, Clock, Eye, ChevronLeft, ChevronRight, Loader2, PenSquare, Tag } from "lucide-react";

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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">게시글</h1>
        </div>
        <Button size="sm" asChild>
          <Link to="/write">
            <Plus className="size-4" />새 글 작성
          </Link>
        </Button>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive">게시글을 불러오는 데 실패했습니다</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/posts", search: { page } })}>
            다시 시도
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="size-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">게시글이 없습니다</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/write">새 글 작성하기</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const meta = post.content ? parsePostMeta(post.content) : null;
            const title = meta?.title || "제목 없음";
            const description = meta?.description || "";
            const tags = meta?.tags ?? [];
            const date = meta?.date || post.created_at.split("T")[0];

            return (
              <Card key={post.id} className="group transition-colors hover:border-primary/30">
                <CardContent className="flex items-start gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to="/write" search={{ postId: post.id }} className="font-medium truncate hover:underline">
                        {title}
                      </Link>
                      <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                        #{post.id}
                      </Badge>
                    </div>

                    {description && <p className="text-sm text-muted-foreground line-clamp-2 mb-1.5">{description}</p>}

                    {tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-1.5">
                        <Tag className="size-3 text-muted-foreground/60" />
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {post.views}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link to="/write" search={{ postId: post.id }}>
                        <PenSquare className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {posts.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate({ to: "/posts", search: { page: page - 1 } })}
          >
            <ChevronLeft className="size-4" />
            이전
          </Button>
          <span className="text-sm text-muted-foreground px-3">{page} 페이지</span>
          <Button
            variant="outline"
            size="sm"
            disabled={posts.length < PAGE_SIZE}
            onClick={() => navigate({ to: "/posts", search: { page: page + 1 } })}
          >
            다음
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
