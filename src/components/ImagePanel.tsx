import { useCallback, useEffect, useRef, useState } from "react";
import { useUploadImage, useDeleteImage } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Upload, Copy, Trash2, Link, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "uploaded-images";

export interface UploadedImage {
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

interface ImagePanelProps {
  onInsert?: (markdown: string) => void;
}

export default function ImagePanel({ onInsert }: ImagePanelProps) {
  const uploadImage = useUploadImage();
  const deleteImage = useDeleteImage();

  const [images, setImages] = useState<UploadedImage[]>(loadImages);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (previewImage?.url === image.url) setPreviewImage(null);
        toast.success("이미지가 삭제되었습니다");
      },
      onError: () => {
        toast.error("삭제에 실패했습니다");
      },
    });
  };

  const handleInsert = (image: UploadedImage) => {
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
          <img src={previewImage.url} alt={previewImage.filename} className="w-full max-h-48 object-contain" />
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
        {images.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">업로드된 이미지가 없습니다</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {images.map((image) => (
              <div key={image.url} className="group relative">
                <button
                  onClick={() => setPreviewImage(image)}
                  className={`
                    block w-full overflow-hidden rounded-md border aspect-square
                    transition-all hover:ring-2 hover:ring-primary/50
                    ${previewImage?.url === image.url ? "ring-2 ring-primary" : ""}
                  `}
                >
                  <img src={image.url} alt={image.filename} className="size-full object-cover" />
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
