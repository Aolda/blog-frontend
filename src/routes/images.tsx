import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth-context";
import { useUploadImage, useDeleteImage } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Copy, Trash2, ImagePlus, Link, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/images")({ component: ImagesPage });

const STORAGE_KEY = "uploaded-images";

interface UploadedImage {
  url: string;
  filename: string;
}

function loadImages(): UploadedImage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveImages(images: UploadedImage[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(images));
}

function extractFilename(url: string): string {
  return url.split("/").pop() ?? url;
}

function ImagesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const uploadImage = useUploadImage();
  const deleteImage = useDeleteImage();

  const [images, setImages] = useState<UploadedImage[]>(loadImages);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    saveImages(images);
  }, [images]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      for (const file of fileArr) {
        if (!file.type.startsWith("image/")) {
          toast.error(`"${file.name}"은(는) 이미지 파일이 아닙니다`);
          continue;
        }
        uploadImage.mutate(file, {
          onSuccess: (data) => {
            const entry: UploadedImage = {
              url: data.url,
              filename: extractFilename(data.url),
            };
            setImages((prev) => [entry, ...prev]);
            toast.success("이미지가 업로드되었습니다");
          },
          onError: () => {
            toast.error(`"${file.name}" 업로드에 실패했습니다`);
          },
        });
      }
    },
    [uploadImage],
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

  const handleDelete = (image: UploadedImage) => {
    deleteImage.mutate(image.filename, {
      onSuccess: () => {
        setImages((prev) => prev.filter((i) => i.url !== image.url));
        toast.success("이미지가 삭제되었습니다");
      },
      onError: () => {
        toast.error("삭제에 실패했습니다");
      },
    });
  };

  const copyMarkdown = async (url: string) => {
    try {
      await navigator.clipboard.writeText(`![image](${url})`);
      toast.success("마크다운이 복사되었습니다");
    } catch {
      toast.error("복사에 실패했습니다");
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

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <ImagePlus className="size-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">이미지 관리</h1>
        <Badge variant="secondary">{images.length}개</Badge>
      </div>

      <Separator />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-4
          rounded-xl border-2 border-dashed p-12 cursor-pointer
          transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
        `}
      >
        {uploadImage.isPending ? (
          <>
            <Loader2 className="size-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">업로드 중...</p>
          </>
        ) : (
          <>
            <Upload className="size-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">이미지를 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP</p>
            </div>
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

      {images.length > 0 && (
        <ScrollArea className="h-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <Card key={image.url} className="overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  <img src={image.url} alt={image.filename} className="size-full object-cover" />
                </div>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xs font-mono truncate">{image.filename}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="xs" onClick={() => copyMarkdown(image.url)}>
                      <Copy className="size-3" />
                      마크다운 복사
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => copyUrl(image.url)}>
                      <Link className="size-3" />
                      URL 복사
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(image)}
                    >
                      <Trash2 className="size-3" />
                      삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">업로드된 이미지가 없습니다.</div>
      )}
    </div>
  );
}
