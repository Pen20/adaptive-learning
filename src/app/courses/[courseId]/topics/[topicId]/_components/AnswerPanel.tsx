import { MathRenderer } from "@/components/MathRenderer";
import { NotationHelp } from "@/components/math/NotationHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Sparkles, Wand2 } from "lucide-react";
import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnswerFormat } from "@/data/topics";
import {
  SCAN_IMAGE_ACCEPT,
  SCAN_IMAGE_HELP_LABEL,
  SCAN_IMAGE_TYPE_LABEL,
} from "@/lib/scanUpload";
import {
  composeStructuredAnswer,
  hasStructuredAnswerFields,
  parseStructuredAnswer,
} from "@/lib/structuredAnswer";

interface AnswerPanelProps {
  finalAnswer: string;
  setFinalAnswer: Dispatch<SetStateAction<string>>;
  debouncedFinalAnswer: string;
  reasoning: string;
  setReasoning: Dispatch<SetStateAction<string>>;
  debouncedReasoning: string;
  answerFormat: AnswerFormat;
  reasoningRef: RefObject<HTMLTextAreaElement | null>;
  onRememberCursor: () => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  transcribing: boolean;
  grading: boolean;
  onAutoFill?: () => void;
  onCheck: () => void;
}

export function AnswerPanel({
  finalAnswer,
  setFinalAnswer,
  debouncedFinalAnswer,
  reasoning,
  setReasoning,
  debouncedReasoning,
  answerFormat,
  reasoningRef,
  onRememberCursor,
  onImageUpload,
  transcribing,
  grading,
  onAutoFill,
  onCheck,
}: AnswerPanelProps) {
  const finalAnswerRef = useRef<HTMLInputElement>(null);
  const finalAnswerCursor = useRef({ start: 0, end: 0 });
  const structuredFields = useMemo(
    () => answerFormat.fields ?? [],
    [answerFormat.fields],
  );
  const hasStructuredFields = hasStructuredAnswerFields(answerFormat);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const finalAnswerComplete = hasStructuredFields
    ? structuredFields.every((field) => fieldValues[field.key]?.trim())
    : Boolean(finalAnswer.trim());

  useEffect(() => {
    if (!hasStructuredFields) {
      setFieldValues({});
      return;
    }

    const parsed = parseStructuredAnswer(finalAnswer, structuredFields);
    setFieldValues((current) =>
      JSON.stringify(current) === JSON.stringify(parsed) ? current : parsed,
    );
  }, [finalAnswer, hasStructuredFields, structuredFields]);

  const saveFinalAnswerCursor = () => {
    const el = finalAnswerRef.current;
    if (el)
      finalAnswerCursor.current = {
        start: el.selectionStart ?? 0,
        end: el.selectionEnd ?? 0,
      };
  };

  const insertIntoFinalAnswer = (code: string) => {
    const { start, end } = finalAnswerCursor.current;
    setFinalAnswer((prev) => {
      const text = prev ?? "";
      return text.slice(0, start) + code + text.slice(end);
    });
    finalAnswerCursor.current = {
      start: start + code.length,
      end: start + code.length,
    };
    finalAnswerRef.current?.focus();
  };

  const updateStructuredField = (key: string, value: string) => {
    const next = { ...fieldValues, [key]: value };
    setFieldValues(next);
    setFinalAnswer(composeStructuredAnswer(structuredFields, next));
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold tracking-wide text-slate-700">
              Final Answer
            </label>
            {!hasStructuredFields && (
              <NotationHelp onInsert={insertIntoFinalAnswer} />
            )}
          </div>

          {hasStructuredFields ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {structuredFields.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                >
                  <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                    {field.label} {field.operator ?? "="}
                  </span>
                  <Input
                    className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    placeholder={field.placeholder}
                    value={fieldValues[field.key] ?? ""}
                    onChange={(event) =>
                      updateStructuredField(field.key, event.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <Input
              ref={finalAnswerRef}
              className="bg-white border-slate-200 shadow-sm focus-visible:ring-blue-500 text-base py-6"
              placeholder={answerFormat.placeholder}
              value={finalAnswer}
              onChange={(event) => setFinalAnswer(event.target.value)}
              onBlur={saveFinalAnswerCursor}
              onSelect={saveFinalAnswerCursor}
            />
          )}

          {debouncedFinalAnswer && (
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm transition-all animate-in fade-in-0 slide-in-from-top-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                  Preview
                </p>
              </div>
              <div className="text-slate-800 overflow-x-auto">
                <MathRenderer content={debouncedFinalAnswer} />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {answerFormat.instruction}
            {answerFormat.alternatives?.length
              ? ` Accepted formats include: ${answerFormat.alternatives.join("; ")}.`
              : ""}{" "}
            You may refer it in the reasoning steps if it helps your
            explanation, but it is not mandatory.
          </p>
        </div>

        <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <label className="text-sm font-semibold tracking-wide flex flex-col sm:flex-row sm:items-center gap-1">
                <span>Reasoning Steps</span>
                <span className="text-muted-foreground font-normal text-xs">
                  (Explain your method; restating the final answer is optional)
                </span>
              </label>
            </div>
            <div className="flex flex-col items-end gap-1">
              <input
                type="file"
                accept={SCAN_IMAGE_ACCEPT}
                capture="environment"
                id="reasoning-image-upload"
                className="hidden"
                onChange={onImageUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 bg-white hover:bg-blue-50 hover:text-blue-700 border-slate-200 text-slate-700 shadow-sm transition-all"
                title={`Scan ${SCAN_IMAGE_TYPE_LABEL} image`}
                onClick={() =>
                  document.getElementById("reasoning-image-upload")?.click()
                }
                disabled={transcribing}
              >
                {transcribing ? (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                ) : (
                  <Camera className="h-3 w-3 text-blue-600" />
                )}
                <span className="hidden sm:inline">Scan</span>
              </Button>
              <span className="text-[10px] font-medium text-muted-foreground">
                {SCAN_IMAGE_HELP_LABEL}
              </span>
            </div>
          </div>
          <Textarea
            ref={reasoningRef}
            className="min-h-[160px] font-mono text-sm bg-white border-slate-200 shadow-sm focus-visible:ring-blue-500 resize-y leading-relaxed"
            placeholder={
              'Type your steps here...\nExample: "By definition, V is..."\nUse $...$ for inline equations and $$...$$ for block equations.'
            }
            value={reasoning}
            onChange={(event) => setReasoning(event.target.value)}
            onBlur={onRememberCursor}
            onSelect={onRememberCursor}
          />

          {debouncedReasoning && (
            <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-sm transition-all animate-in fade-in-0 slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-100">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  Live Math Preview
                </p>
              </div>
              <div className="text-slate-800 leading-relaxed break-words overflow-x-auto">
                <MathRenderer content={debouncedReasoning} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {onAutoFill && (
            <Button
              type="button"
              variant="outline"
              className="sm:w-auto gap-2 border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
              onClick={onAutoFill}
              disabled={grading}
              title="Fill expected answer and reasoning for testing"
            >
              <Wand2 className="h-4 w-4" />
              Fulfill Auto
            </Button>
          )}

          <Button
            className="flex-1 shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-6"
            size="lg"
            onClick={onCheck}
            disabled={grading || !finalAnswerComplete || !reasoning.trim()}
          >
            {grading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Grading and Analyzing...
              </>
            ) : (
              "Check Answer"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
