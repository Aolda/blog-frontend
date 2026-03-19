import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PenSquare, Image, User, LogOut, Settings, Newspaper } from "lucide-react";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src="/aolda.svg" alt="Aolda 로고" className="h-6 w-6" />
            <span>아올다 블로그 콘솔</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden items-center gap-1 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/write">
                  <PenSquare className="size-4" />
                  글쓰기
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/posts">
                  <Newspaper className="size-4" />
                  게시글
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild>
                <Link to="/images">
                  <Image className="size-4" />
                  이미지 관리
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile">
                  <User className="size-4" />
                  프로필
                </Link>
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar size="sm">
                    {user.profile && <AvatarImage src={user.profile} alt={user.username} />}
                    <AvatarFallback>{(user.name ?? user.username).charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline-block">{user.name ?? user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <Settings className="size-4" />
                    설정
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
