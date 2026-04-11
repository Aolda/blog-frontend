import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, Loader2, User, Globe, Github, Gitlab, Linkedin, MessageCircle, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/contexts/auth-context";
import { useUpdateProfile } from "@/lib/queries";
import { getAccessToken, getRefreshToken } from "@/lib/auth";
import { formatKoreanDate } from "@/lib/date";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");
  const [gitlab, setGitlab] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [discord, setDiscord] = useState("");
  const [mail, setMail] = useState("");

  useEffect(() => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      navigate({ to: "/login" });
    }
  }, [auth.isAuthenticated, auth.isLoading, navigate]);

  useEffect(() => {
    if (auth.user) {
      setName(auth.user.name ?? "");
      setBio(auth.user.bio ?? "");
      setAvatar(auth.user.avatar ?? "");
      setWebsite(auth.user.website ?? "");
      setGithub(auth.user.github ?? "");
      setGitlab(auth.user.gitlab ?? "");
      setLinkedin(auth.user.linkedin ?? "");
      setDiscord(auth.user.discord ?? "");
      setMail(auth.user.mail ?? "");
    }
  }, [auth.user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        name: name || null,
        bio: bio || null,
        avatar: avatar || null,
        website: website || null,
        github: github || null,
        gitlab: gitlab || null,
        linkedin: linkedin || null,
        discord: discord || null,
        mail: mail || null,
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
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!auth.user) {
    return null;
  }

  const user = auth.user;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
              <AvatarImage src={avatar || undefined} alt={user.username} />
              <AvatarFallback className="bg-primary/5">
                <User className="w-10 h-10 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 w-full space-y-3">
              <div className="text-center sm:text-left">
                <h1 className="text-xl font-semibold">{name || user.username}</h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {formatKoreanDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">기본 정보</CardTitle>
            <CardDescription>프로필에 표시될 정보를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="표시할 이름" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">프로필 이미지 URL</Label>
                <Input
                  id="avatar"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
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
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">소셜 링크</CardTitle>
            <CardDescription>외부 프로필과 연결하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  웹사이트
                </Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github" className="flex items-center gap-2">
                  <Github className="w-3.5 h-3.5" />
                  GitHub
                </Label>
                <Input
                  id="github"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gitlab" className="flex items-center gap-2">
                  <Gitlab className="w-3.5 h-3.5" />
                  GitLab
                </Label>
                <Input
                  id="gitlab"
                  value={gitlab}
                  onChange={(e) => setGitlab(e.target.value)}
                  placeholder="https://gitlab.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discord" className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Discord
                </Label>
                <Input
                  id="discord"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="username#0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mail" className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  공개 이메일
                </Label>
                <Input
                  id="mail"
                  type="email"
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                  placeholder="public@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          저장
        </Button>
      </form>
    </div>
  );
}
