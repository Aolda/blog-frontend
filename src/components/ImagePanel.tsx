import { isAxiosError } from "axios";
import { useCallback, useRef, useState } from "react";
import { useUploadImage, useDeleteImage, usePostImages } from "@/lib/queries";
import type { ApiError, ImageResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Upload, Copy, Trash2, Link, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

interface ImagePanelProps {
  postId: number | null;
  onInsert?: (markdown: string) => void;
}

function getApiErrorMessage(error: unknown): string | null {
  if (!isAxiosError<ApiError>(error)) {
    return null;
  }

  const detail = error.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0]?.msg ?? null;
  }

  return null;
}

export default function ImagePanel({ postId, onInsert }: ImagePanelProps) {
  const uploadImage = useUploadImage();
  const deleteImage = useDeleteImage();
  const { data: images = [], isLoading: isLoadingImages } = usePostImages(postId);

  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (postId === null) {
        toast.error("게시글이 아직 생성되지 않았습니다");
        return;
      }
      const fileArr = Array.from(files);
      for (const file of fileArr) {
        if (!file.type.startsWith("image/")) {
          toast.error(`"${file.name}"은(는) 이미지 파일이 아닙니다`);
          continue;
        }
        uploadImage.mutate(
          { postId, file },
          {
            onSuccess: () => {
              toast.success("이미지가 업로드되었습니다");
            },
            onError: () => {
              toast.error(`"${file.name}" 업로드에 실패했습니다`);
            },
          },
        );
      }
    },
    [postId, uploadImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDelete = (image: ImageResponse) => {
    if (postId === null) return;
    deleteImage.mutate(
      { imageId: image.id, postId },
      {
        onSuccess: () => {
          if (previewImage?.id === image.id) setPreviewImage(null);
          toast.success("이미지가 삭제되었습니다");
        },
        onError: (error) => {
          const message = getApiErrorMessage(error);
          if (message === "이미지 오브젝트 키가 없습니다.") {
            toast.error("레거시 이미지라 삭제할 수 없습니다");
            return;
          }

          toast.error(message ?? "삭제에 실패했습니다");
        },
      },
    );
  };

  const handleInsert = (image: ImageResponse) => {
    const md = `![image](${image.url})`;
    if (onInsert) {
      onInsert(md);
      toast.success("본문에 삽입되었습니다");
    } else {
      navigator.clipboard.writeText(md).then(
        () => toast.success("마크다운이 복사되었습니다"),
        () => toast.error("복사에 실패했습니다"),
      );
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL이 복사되었습니다");
    } catch {
      toast.error("복사에 실패했습니다");
    }
  };

  const extractFilename = (url: string) => url.split("/").pop() ?? url;

  if (postId === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">게시글 생성 후 이미지를 업로드할 수 있습니다</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          flex cursor-pointer flex-col items-center justify-center gap-2
          rounded-lg border-2 border-dashed p-4 transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
        `}
      >
        {uploadImage.isPending ? (
          <>
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">업로드 중...</p>
          </>
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">드래그 또는 클릭하여 업로드</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {previewImage && (
        <div className="relative mt-3 rounded-lg border bg-muted/50 overflow-hidden">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-1.5 right-1.5 z-10 rounded-full bg-background/80 p-0.5 hover:bg-background"
          >
            <X className="size-3.5" />
          </button>
          <img
            src={previewImage.url}
            alt={extractFilename(previewImage.url)}
            className="w-full max-h-48 object-contain"
          />
          <div className="flex items-center gap-1 p-2">
            <Button variant="outline" size="xs" className="flex-1" onClick={() => handleInsert(previewImage)}>
              <ImagePlus className="size-3" />
              본문에 삽입
            </Button>
            <Button variant="outline" size="xs" onClick={() => copyUrl(previewImage.url)}>
              <Link className="size-3" />
            </Button>
            <Button
              variant="outline"
              size="xs"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(previewImage)}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="mt-3 flex-1">
        {isLoadingImages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">업로드된 이미지가 없습니다</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {images.map((image) => (
              <div key={image.id} className="group relative">
                <button
                  onClick={() => setPreviewImage(image)}
                  className={`
                    block w-full overflow-hidden rounded-md border aspect-square
                    transition-all hover:ring-2 hover:ring-primary/50
                    ${previewImage?.id === image.id ? "ring-2 ring-primary" : ""}
                  `}
                >
                  <img src={image.url} alt={extractFilename(image.url)} className="size-full object-cover" />
                </button>

                <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsert(image);
                        }}
                        className="rounded bg-background/90 p-0.5 shadow-sm hover:bg-background"
                      >
                        <Copy className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">본문에 삽입</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image);
                        }}
                        className="rounded bg-background/90 p-0.5 shadow-sm hover:bg-background text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">삭제</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
