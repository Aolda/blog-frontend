import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/contexts/auth-context";
import { useUpdateProfile } from "@/lib/queries";
import { getAccessToken, getRefreshToken } from "@/lib/auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      navigate({ to: "/login" });
    }
  }, [auth.isAuthenticated, auth.isLoading, navigate]);

  useEffect(() => {
    if (auth.user) {
      setName(auth.user.name ?? "");
      setBio(auth.user.bio ?? "");
      setProfileUrl(auth.user.profile ?? "");
    }
  }, [auth.user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        name: name || null,
        bio: bio || null,
        profile: profileUrl || null,
      },
      {
        onSuccess: () => {
          toast.success("프로필이 업데이트되었습니다.");
          queryClient.invalidateQueries({ queryKey: ["me"] });
          const accessToken = getAccessToken();
          const refreshToken = getRefreshToken();
          if (accessToken && refreshToken) {
            auth.login(accessToken, refreshToken);
          }
        },
        onError: () => {
          toast.error("프로필 업데이트에 실패했습니다.");
        },
      },
    );
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!auth.user) {
    return null;
  }

  const user = auth.user;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileUrl || undefined} alt={user.username} />
                <AvatarFallback>
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{user.username}</CardTitle>
                <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>{user.role}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground">아이디</Label>
              <p className="text-sm">{user.username}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">이메일</Label>
              <p className="text-sm">{user.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">가입일</Label>
              <p className="text-sm">
                {new Date(user.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <Separator />

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profileUrl">프로필 이미지 URL</Label>
                <Input
                  id="profileUrl"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">자기소개</Label>
                  <span className="text-xs text-muted-foreground">{bio.length}/500</span>
                </div>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setBio(e.target.value);
                    }
                  }}
                  placeholder="자기소개를 입력하세요"
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
