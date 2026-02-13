import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenSquare, ImageIcon, UserCircle, FileText } from "lucide-react";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <Dashboard userName={user?.name ?? user?.username ?? "사용자"} />;
}

function LandingPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Aolda Blog</h1>
        <p className="text-lg text-muted-foreground">
          블로그 관리 대시보드에 오신 것을 환영합니다.
          <br />
          로그인하여 글을 작성하고 이미지를 관리하세요.
        </p>
        <Button asChild size="lg">
          <Link to="/login">로그인</Link>
        </Button>
      </div>
    </div>
  );
}

const actions = [
  {
    title: "새 글 작성",
    description: "MDX 템플릿을 생성하고 새로운 글을 작성합니다.",
    icon: PenSquare,
    to: "/write" as const,
  },
  {
    title: "임시저장",
    description: "작성 중인 글을 확인하고 이어서 작성합니다.",
    icon: FileText,
    to: "/drafts" as const,
  },
  {
    title: "이미지 관리",
    description: "이미지를 업로드하고 마크다운 링크를 복사합니다.",
    icon: ImageIcon,
    to: "/images" as const,
  },
  {
    title: "프로필 수정",
    description: "이름, 소개, 프로필 사진을 수정합니다.",
    icon: UserCircle,
    to: "/profile" as const,
  },
];

function Dashboard({ userName }: { userName: string }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">안녕하세요, {userName}님</h1>
        <p className="mt-1 text-muted-foreground">오늘은 무엇을 하시겠어요?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map(({ title, description, icon: Icon, to }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardHeader>
                <Icon className="size-8 text-primary mb-2" />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
