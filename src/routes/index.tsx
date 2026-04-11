import { User, PenSquare, UserCircle, Newspaper, Users } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: HomePage });

const features = [
  { icon: PenSquare, title: "MDX 에디터", description: "마크다운 문법과 다양한 컴포넌트를 활용한 블로깅 작성" },
  { icon: Newspaper, title: "게시글 관리", description: "발행된 블로깅 수정 및 메타데이터, 조회수 관리" },
  { icon: Users, title: "블로깅 프로필 관리", description: "블로그 개인 프로필 관리 및 게시글 작성자 설정" },
];

const actions = [
  {
    title: "새 글 작성",
    description: "MDX 헤더를 생성하고 새로운 글을 작성합니다.",
    icon: PenSquare,
    to: "/write" as const,
  },
  { title: "게시글 관리", description: "발행된 게시글을 확인하고 수정합니다.", icon: Newspaper, to: "/posts" as const },
  { title: "구성원 목록", description: "블로그 구성원을 확인하고 관리합니다.", icon: Users, to: "/members" as const },
  {
    title: "프로필 수정",
    description: "이름, 소개, 프로필 사진을 수정합니다.",
    icon: UserCircle,
    to: "/profile" as const,
  },
];

function HomePage() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <Dashboard userName={user?.name ?? user?.username ?? "사용자"} />;
}

function LandingPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4 sm:px-8">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-16 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Aolda Blog Service</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
              아올다 기술 블로그 콘텐츠 운영 및 관리를 위한 통합 콘솔입니다. 아올다 통합 계정으로 로그인하여 블로깅을
              작성하고 게시글을 관리할 수 있습니다.
            </p>
          </div>

          <Button asChild size="lg" className="h-12 px-8 text-base font-semibold w-full sm:w-auto shadow-sm">
            <Link to="/login">
              <User className="size-5" /> 아올다 계정으로 시작하기
            </Link>
          </Button>
        </div>

        <div className="flex-1 w-full grid gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-center gap-5 rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:bg-muted/50 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-background border shadow-sm shrink-0">
                <Icon className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ userName }: { userName: string }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">안녕하세요, {userName}님</h1>
        <p className="mt-1 text-muted-foreground">오늘은 무엇을 하시겠어요?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map(({ title, description, icon: Icon, to }) => (
          <Link key={to} to={to} className="group">
            <div className="h-full flex flex-col gap-2 rounded-xl border py-6 px-6 shadow-sm transition-colors group-hover:border-primary/40">
              <Icon className="size-8 text-primary" />
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
