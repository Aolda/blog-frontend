import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCreatePostTemplate } from "@/lib/queries";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/write")({
  component: WritePage,
});

function WritePage() {
  const navigate = useNavigate();
  const { mutate, data, isIdle, isPending, isError, reset } = useCreatePostTemplate();

  const createPost = () => {
    mutate();
  };

  useEffect(() => {
    if (!isIdle) return;
    createPost();
  }, [isIdle]);

  useEffect(() => {
    if (!data) return;

    navigate({
      to: "/edit",
      search: { postId: data.post_id },
      replace: true,
    });
  }, [data, navigate]);

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">새 게시글 생성에 실패했습니다.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            reset();
          }}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <LoadingState
      message={isPending ? "새 게시글을 준비하는 중..." : "새 게시글 생성 중..."}
      className="min-h-[60vh]"
    />
  );
}
