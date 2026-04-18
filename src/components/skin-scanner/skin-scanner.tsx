"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImageIcon, Loader2, Scan } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { AffiliateProductGrid } from "@/components/skin-scanner/affiliate-product-grid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SkinAnalysis } from "@/lib/gemini/analyze-skin";
import { t } from "@/lib/translations";
import type { MatchedProductResult } from "@/lib/products/matcher";
import type { ProductCategoryId } from "@/types/skin-analysis";

type ApiOk = {
  analysis: SkinAnalysis;
  recommendedProducts: Record<ProductCategoryId, MatchedProductResult>;
  disclaimer: string;
  scanId: string | null;
};

export function SkinScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiOk | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [previewUrl]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError(null);
    setResult(null);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError(t("scanner.error_not_image"));
      return;
    }
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError(t("scanner.error_camera"));
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError(t("scanner.error_camera"));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) {
      setError(t("scanner.error_capture"));
      return;
    }
    const f = new File([blob], "capture.jpg", { type: "image/jpeg" });
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    setResult(null);
    stopCamera();
  };

  const scan = async () => {
    if (!file) {
      setError(t("scanner.error_no_file"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/analyze-skin", {
        method: "POST",
        body: fd,
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : t("scanner.error_generic");
        throw new Error(msg);
      }
      setResult(data as ApiOk);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("scanner.error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="scanner"
      className="scroll-mt-20 border-b border-border bg-card/50 px-4 py-14 sm:px-6"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("scanner.title")}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("scanner.description")}
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">{t("scanner.card_title")}</CardTitle>
            <CardDescription>
              {t("scanner.card_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                <TabsTrigger value="upload">
                  <ImageIcon className="size-4" />
                  {t("scanner.upload_tab")}
                </TabsTrigger>
                <TabsTrigger value="camera">
                  <Camera className="size-4" />
                  {t("scanner.camera_tab")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-3 pt-2">
                <Label htmlFor="skin-file" className="sr-only">
                  {t("scanner.upload_tab")}
                </Label>
                <Input
                  id="skin-file"
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="cursor-pointer"
                />
              </TabsContent>
              <TabsContent value="camera" className="space-y-3 pt-2">
                <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
                  <video
                    ref={videoRef}
                    className="aspect-[4/3] w-full bg-black object-cover"
                    playsInline
                    muted
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {!cameraOn ? (
                    <Button type="button" variant="secondary" onClick={startCamera}>
                      <Camera className="size-4" />
                      {t("scanner.start_camera")}
                    </Button>
                  ) : (
                    <>
                      <Button type="button" onClick={capturePhoto}>
                        {t("scanner.capture_photo")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={stopCamera}
                      >
                        {t("scanner.stop_camera")}
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                {t("scanner.preview")}
              </p>
              <AnimatePresence mode="wait">
                {previewUrl ? (
                  <motion.div
                    key={previewUrl}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <Image
                      src={previewUrl}
                      alt={t("scanner.preview")}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-sm text-muted-foreground"
                  >
                    {t("scanner.no_image")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={!file || loading}
              onClick={() => void scan()}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("scanner.scanning")}
                </>
              ) : (
                <>
                  <Scan className="size-4" />
                  {t("scanner.scan_now")}
                </>
              )}
            </Button>

            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-muted-foreground">
                    {t("scanner.analyzing")}
                  </p>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </motion.div>
              )}
            </AnimatePresence>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>{t("scanner.error_title")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-6 border-t border-border pt-6">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <Alert>
                    <AlertTitle>{t("scanner.important_title")}</AlertTitle>
                    <AlertDescription>{result.disclaimer}</AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="text-lg font-semibold">{t("scanner.summary_title")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {t("scanner.skin_type_label")}
                      </span>{" "}
                      {result.analysis.skin_type}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">{t("scanner.concerns_title")}</h4>
                    <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                      {result.analysis.concerns.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="font-medium">{t("scanner.morning_routine_title")}</h4>
                      <ol className="mt-2 list-inside list-decimal text-sm text-muted-foreground">
                        {result.analysis.morning_routine.map((step, i) => (
                          <li key={`m-${i}`}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h4 className="font-medium">{t("scanner.evening_routine_title")}</h4>
                      <ol className="mt-2 list-inside list-decimal text-sm text-muted-foreground">
                        {result.analysis.evening_routine.map((step, i) => (
                          <li key={`e-${i}`}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">{t("scanner.suggested_actives_title")}</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.analysis.ingredients.map((ing) => (
                        <span
                          key={ing}
                          className="rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs font-medium text-secondary-foreground"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-3 text-lg font-semibold">
                      {t("scanner.product_ideas_title")}
                    </h3>
                    <AffiliateProductGrid
                      recommendedProducts={result.recommendedProducts}
                      scanId={result.scanId}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
