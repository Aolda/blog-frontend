import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storeAuthRedirect } from "@/lib/auth-redirect";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" && search.redirect.length > 0 ? search.redirect : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ href: search.redirect ?? "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

  const handleAoldaLogin = () => {
    storeAuthRedirect(redirectTo ?? "/");

    const loginUrl = new URL(`${apiBaseUrl}/auth/login`);
    loginUrl.searchParams.set("console_page_url", window.location.origin);
    window.location.href = loginUrl.toString();
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>아올다 통합 계정으로 블로그 콘솔에 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full gap-2.5" size="lg" onClick={handleAoldaLogin}>
            <img src="/aolda.svg" alt="" className="size-4 shrink-0" aria-hidden="true" />
            <span>아올다 계정으로 로그인</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
