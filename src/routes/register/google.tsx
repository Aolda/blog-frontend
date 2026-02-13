import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { useGoogleFinish } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/register/google")({
  component: GoogleRegisterPage,
});

function GoogleRegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const googleFinish = useGoogleFinish();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await googleFinish.mutateAsync({
      username,
      register_token: token,
    });
    await auth.login(data.access_token, data.refresh_token);
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">회원가입 완료</CardTitle>
          <CardDescription>사용할 아이디를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                placeholder="사용할 아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {googleFinish.isError && (
              <p className="text-sm text-destructive">회원가입에 실패했습니다. 다시 시도해주세요.</p>
            )}

            <Button type="submit" className="w-full" disabled={googleFinish.isPending || !username}>
              {googleFinish.isPending ? "처리 중..." : "가입 완료"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
