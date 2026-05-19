"use client";

import { useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "@/lib/convex";
import { validateScanImageFile } from "@/lib/scanUpload";

export function useImageTranscription(
  setReasoning: Dispatch<SetStateAction<string>>,
) {
  const transcribeReasoning = useAction(api.grading.transcribeReasoning);
  const [transcribing, setTranscribing] = useState(false);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateScanImageFile(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      setTranscribing(true);

      try {
        const transcription = await transcribeReasoning({ image: base64 });
        setReasoning((previous) =>
          previous ? `${previous}\n\n${transcription}` : transcription,
        );
        event.target.value = "";
      } catch (error) {
        console.error("Transcription failed:", error);
        toast.error("Failed to transcribe image. Please try again.");
      } finally {
        setTranscribing(false);
      }
    };
  };

  return { transcribing, handleImageUpload };
}
