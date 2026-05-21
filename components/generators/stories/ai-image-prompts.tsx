"use client";

import { useState } from "react";
import type { ParsedStorySlide } from "@/components/generators/story-slide-card";

interface AiImagePromptsProps {
  slides: ParsedStorySlide[];
}

function buildPrompt(slide: ParsedStorySlide): {
  midjourney: string;
  dalle: string;
} {
  const direction = slide.visualDirection || "";
  const imageRec = slide.imageRecommendation || "";
  const headline = slide.headline || "";

  const baseContext = [
    direction,
    imageRec ? `Image type: ${imageRec}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  const midjourney = [
    `Instagram Story slide background for "${headline}"`,
    baseContext,
    "Vertical 9:16 aspect ratio, 1080x1920px",
    "Modern, high-quality, vibrant, social media aesthetic",
    "Leave central area clear for text overlay",
    "--ar 9:16 --v 6 --style raw",
  ]
    .filter(Boolean)
    .join(". ");

  const dalle = [
    `Create a vertical Instagram Story background image (9:16 aspect ratio).`,
    `Theme: "${headline}".`,
    baseContext,
    `Style: Modern social media aesthetic, vibrant colors, high contrast.`,
    `Important: Leave the center area clear for text overlay. No text in the image.`,
  ]
    .filter(Boolean)
    .join(" ");

  return { midjourney, dalle };
}

export function AiImagePrompts({ slides }: AiImagePromptsProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedType, setCopiedType] = useState<string>("");
  const [platform, setPlatform] = useState<"midjourney" | "dalle">("midjourney");

  if (slides.length === 0) return null;

  const handleCopy = async (text: string, idx: number, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedIdx(null);
      setCopiedType("");
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-tertiary">
          Copy-paste image generation prompts for each slide, built from
          the visual direction and image recommendation.
        </p>
        <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-medium shrink-0">
          <button
            type="button"
            onClick={() => setPlatform("midjourney")}
            className={`px-2.5 py-1 transition-colors ${
              platform === "midjourney"
                ? "bg-accent text-white"
                : "bg-surface text-text-secondary hover:text-text-primary"
            }`}
          >
            Midjourney
          </button>
          <button
            type="button"
            onClick={() => setPlatform("dalle")}
            className={`px-2.5 py-1 transition-colors ${
              platform === "dalle"
                ? "bg-accent text-white"
                : "bg-surface text-text-secondary hover:text-text-primary"
            }`}
          >
            DALL-E
          </button>
        </div>
      </div>

      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {slides.map((slide, i) => {
          const prompts = buildPrompt(slide);
          const prompt = platform === "midjourney" ? prompts.midjourney : prompts.dalle;
          const isCopied = copiedIdx === i && copiedType === platform;

          return (
            <div
              key={i}
              className="rounded-lg bg-background border border-border/50 p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-surface-hover text-[10px] font-bold text-text-secondary">
                    {slide.index}
                  </span>
                  <span className="text-[11px] font-semibold text-text-primary">
                    {slide.funnelRole}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(prompt, i, platform)}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-hover hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
                >
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed font-mono bg-surface-hover rounded-md p-2">
                {prompt}
              </p>
              {slide.imageRecommendation && (
                <p className="mt-1.5 text-[10px] text-text-tertiary flex items-center gap-1">
                  <svg
                    className="w-3 h-3 text-accent shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                    />
                  </svg>
                  {slide.imageRecommendation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
