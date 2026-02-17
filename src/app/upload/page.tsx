"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileVideo, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { uploadFileViaTus } from "@/lib/tus-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type UploadStep = "select" | "uploading" | "processing" | "done" | "error";

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<UploadStep>("select");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [videoId, setVideoId] = useState("");

  const [dragging, setDragging] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.();
    };
  }, []);

  const acceptFile = useCallback(
    (selected: File) => {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      }
    },
    [title]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) acceptFile(selected);
    },
    [acceptFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped && dropped.type.startsWith("video/")) {
        acceptFile(dropped);
      }
    },
    [acceptFile]
  );

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    setStep("uploading");
    setError("");

    try {
      // Step 1: Initiate upload
      const initRes = await fetch("/api/upload/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });

      if (!initRes.ok) {
        const data = await initRes.json();
        throw new Error(data.error || "Failed to initiate upload");
      }

      const { videoId: vid, uploadUrl, taskToken } = await initRes.json();
      setVideoId(vid);

      // Step 2: Upload file via TUS resumable protocol
      const { promise: uploadPromise, abort } = uploadFileViaTus({
        file,
        uploadUrl,
        taskToken,
        onProgress: (percent) => setProgress(percent),
      });
      abortRef.current = abort;

      const { tusUri } = await uploadPromise;

      // Step 3: Start transcoding
      setStep("processing");
      const transcodeRes = await fetch("/api/upload/start-transcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: vid, taskToken, tusUri }),
      });

      if (!transcodeRes.ok) {
        const data = await transcodeRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start transcoding");
      }

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStep("error");
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">Upload video</h1>

      {step === "select" && (
        <div className="space-y-6">
          {/* File drop zone */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors ${
              dragging
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className={`h-12 w-12 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
            <div className="text-center">
              <p className="text-sm font-medium">
                {file ? file.name : "Drag and drop a video, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                MP4, WebM, MOV up to 5GB
              </p>
            </div>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {file && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileVideo className="h-4 w-4" />
                <span>
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title *
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your video a title"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers about your video"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!title.trim()}
                  className="w-full"
                >
                  Upload
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {step === "uploading" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Uploading...</p>
          <div className="w-full max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {progress}%
            </p>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Processing video...</p>
          <p className="text-sm text-muted-foreground">
            This may take a few minutes. You can leave this page.
          </p>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <CheckCircle className="h-12 w-12 text-green-600" />
          <p className="text-lg font-medium">Upload complete!</p>
          <p className="text-sm text-muted-foreground">
            Your video is being processed and will be available shortly.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/studio/videos")}
            >
              Go to Studio
            </Button>
            <Button onClick={() => router.push(`/watch/${videoId}`)}>
              View video
            </Button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium">Upload failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => setStep("select")}>Try again</Button>
        </div>
      )}
    </div>
  );
}
