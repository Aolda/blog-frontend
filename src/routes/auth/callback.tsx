import { useEffect, useRef } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/contexts/auth-context";
import { clearTokens } from "@/lib/auth";
import { clearAuthRedirect, getAuthRedirect } from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { login } = useAuth();
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (hasHandledCallback.current) {
      return;
    }
    hasHandledCallback.current = true;

    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const detail = params.get("detail");

    if (status !== "success" || !accessToken || !refreshToken) {
      clearAuthRedirect();
      clearTokens();
      toast.error(detail ?? "로그인에 실패했습니다. 다시 시도해주세요.");
      navigate({ to: "/login" });
      return;
    }

    const redirectTarget = getAuthRedirect() ?? "/";

    login(accessToken, refreshToken)
      .then(() => {
        return router.invalidate().finally(() => {
          clearAuthRedirect();
          router.history.push(redirectTarget);
        });
      })
      .catch(() => {
        clearTokens();
        toast.error("로그인 처리에 실패했습니다. 다시 시도해주세요.");
        navigate({
          to: "/login",
          search: {
            redirect: redirectTarget,
          },
        });
      });
  }, [login, navigate, router]);

  return <LoadingState message="로그인 처리 중..." className="min-h-[calc(100vh-3.5rem)]" />;
}
