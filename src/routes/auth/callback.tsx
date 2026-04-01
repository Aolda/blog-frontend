import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { clearTokens } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const detail = params.get("detail");

    if (status !== "success" || !accessToken || !refreshToken) {
      clearTokens();
      toast.error(detail ?? "로그인에 실패했습니다. 다시 시도해주세요.");
      navigate({ to: "/login" });
      return;
    }

    auth
      .login(accessToken, refreshToken)
      .then(() => {
        navigate({ to: "/" });
      })
      .catch(() => {
        clearTokens();
        toast.error("로그인 처리에 실패했습니다. 다시 시도해주세요.");
        navigate({ to: "/login" });
      });
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <p className="text-sm text-muted-foreground">로그인 처리 중...</p>
    </div>
  );
}
