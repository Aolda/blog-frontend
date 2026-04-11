import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { router } from "@/router";

import "./styles.css";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("앱 마운트 노드를 찾을 수 없습니다.");
}

function AppRouter() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">인증 상태 확인 중...</p>
      </div>
    );
  }

  return <RouterProvider router={router} context={{ auth }} />;
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>,
);
