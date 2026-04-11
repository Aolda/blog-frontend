import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthors } from "@/lib/queries";
import { LoadingState } from "@/components/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Users, ChevronLeft, ChevronRight, Globe, Github, Linkedin, Mail, User } from "lucide-react";

interface MembersSearch {
  page?: number;
}

export const Route = createFileRoute("/_authenticated/members")({
  component: MembersPage,
  validateSearch: (search: Record<string, unknown>): MembersSearch => ({
    page:
      typeof search.page === "number" ? search.page : typeof search.page === "string" ? Number(search.page) || 1 : 1,
  }),
});

const PAGE_SIZE = 12;

function MembersPage() {
  const navigate = useNavigate();
  const { page = 1 } = Route.useSearch();
  const skip = (page - 1) * PAGE_SIZE;
  const { data: authors = [], isLoading, isError } = useAuthors(skip, PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
          <Users className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">구성원</h1>
          <p className="text-sm text-muted-foreground mt-0.5">블로그 작성자 목록입니다</p>
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <LoadingState message="구성원을 불러오는 중..." className="py-24" />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Users className="size-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium">구성원을 불러오는 데 실패했습니다</p>
          <p className="text-sm text-muted-foreground mt-1">네트워크 연결을 확인해주세요</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate({ to: "/members", search: { page } })}>
            다시 시도
          </Button>
        </div>
      ) : authors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="size-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">구성원이 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <Card key={author.id} className="group transition-all duration-200 hover:shadow-md hover:border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="size-20 ring-2 ring-primary/10 ring-offset-2 ring-offset-background group-hover:ring-primary/30 transition-all">
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback className="bg-primary/5">
                      <User className="size-10 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg mt-4">{author.name}</h3>
                  <p className="text-sm text-muted-foreground">@{author.username}</p>
                  {author.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{author.bio}</p>}
                  <div className="flex items-center gap-3 mt-4">
                    {author.github && (
                      <a
                        href={author.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Github className="size-5" />
                      </a>
                    )}
                    {author.website && (
                      <a
                        href={author.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Globe className="size-5" />
                      </a>
                    )}
                    {author.linkedin && (
                      <a
                        href={author.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Linkedin className="size-5" />
                      </a>
                    )}
                    {author.mail && (
                      <a
                        href={`mailto:${author.mail}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Mail className="size-5" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {authors.length > 0 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate({ to: "/members", search: { page: page - 1 } })}
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
            disabled={authors.length < PAGE_SIZE}
            onClick={() => navigate({ to: "/members", search: { page: page + 1 } })}
            className="gap-1.5"
          >
            다음
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
