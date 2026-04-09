"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

export type MarkingCriterion = {
  id: string;
  description: string;
  marks: number;
};

type SchemeMap = Record<string, MarkingCriterion[]>;

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

function criteriaSum(criteria: MarkingCriterion[]) {
  return roundTo2(criteria.reduce((s, c) => s + (Number(c.marks) || 0), 0));
}

export function MarkingSchemeEditor() {
  const allExams = useQuery(api.exams.getAllExams);
  const updateSchemes = useMutation(api.exams.updateExamMarkingSchemes);

  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [schemes, setSchemes] = useState<SchemeMap>({});
  const [saving, setSaving] = useState(false);

  const selectedExam = allExams?.find((e) => e._id === selectedExamId);

  // Load existing schemes when exam selection changes
  useEffect(() => {
    if (!selectedExam) { setSchemes({}); return; }
    if (selectedExam.markingSchemes) {
      try {
        setSchemes(JSON.parse(selectedExam.markingSchemes));
      } catch {
        setSchemes({});
      }
    } else {
      // Initialize empty schemes for each question slot
      const initial: SchemeMap = {};
      for (let i = 0; i < selectedExam.questionCount; i++) {
        initial[String(i)] = [];
      }
      setSchemes(initial);
    }
  }, [selectedExamId, selectedExam]);

  const addCriterion = (slotIndex: string) => {
    const existing = schemes[slotIndex] ?? [];
    const usedSum = criteriaSum(existing);
    const remaining = roundTo2(1 - usedSum);
    const newId = `c${existing.length + 1}`;
    setSchemes((prev) => ({
      ...prev,
      [slotIndex]: [
        ...existing,
        { id: newId, description: "", marks: remaining > 0 ? remaining : 0 },
      ],
    }));
  };

  const removeCriterion = (slotIndex: string, cIdx: number) => {
    setSchemes((prev) => {
      const updated = [...(prev[slotIndex] ?? [])];
      updated.splice(cIdx, 1);
      return { ...prev, [slotIndex]: updated };
    });
  };

  const updateCriterion = (
    slotIndex: string,
    cIdx: number,
    field: keyof MarkingCriterion,
    value: string | number
  ) => {
    setSchemes((prev) => {
      const updated = [...(prev[slotIndex] ?? [])];
      updated[cIdx] = { ...updated[cIdx], [field]: value };
      return { ...prev, [slotIndex]: updated };
    });
  };

  const clearSlot = (slotIndex: string) => {
    setSchemes((prev) => ({ ...prev, [slotIndex]: [] }));
  };

  const handleSave = async () => {
    if (!selectedExamId) return;

    // Validate: for slots with criteria, sum must equal 1
    for (const [slot, criteria] of Object.entries(schemes)) {
      if (criteria.length === 0) continue;
      const sum = criteriaSum(criteria);
      if (Math.abs(sum - 1) > 0.001) {
        toast.error(`Question ${Number(slot) + 1}: criteria marks sum to ${sum}, must equal 1.0`);
        return;
      }
      if (criteria.some((c) => !c.description.trim())) {
        toast.error(`Question ${Number(slot) + 1}: all criteria must have a description`);
        return;
      }
    }

    // Strip empty-criteria slots (they default to binary grading)
    const toSave: SchemeMap = {};
    for (const [slot, criteria] of Object.entries(schemes)) {
      if (criteria.length > 0) toSave[slot] = criteria;
    }

    setSaving(true);
    try {
      await updateSchemes({
        examId: selectedExamId as any,
        markingSchemes: JSON.stringify(toSave),
      });
      toast.success("Marking schemes saved successfully.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (!allExams) return null;

  return (
    <div className="space-y-6">
      {/* Exam selector */}
      <div className="flex items-center gap-3">
        <Select value={selectedExamId} onValueChange={setSelectedExamId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select an exam…" />
          </SelectTrigger>
          <SelectContent>
            {allExams.map((e) => (
              <SelectItem key={e._id} value={e._id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedExam && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving…" : "Save Schemes"}
          </Button>
        )}
      </div>

      {!selectedExam && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Info className="h-4 w-4" /> Select an exam to configure marking schemes.
        </p>
      )}

      {selectedExam && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Define criteria for each question slot. Slots with no criteria use binary grading (0 or 1).
            Marks per slot must sum to exactly <strong>1.0</strong>.
          </p>

          {Array.from({ length: selectedExam.questionCount }, (_, i) => {
            const slotKey = String(i);
            const criteria = schemes[slotKey] ?? [];
            const sum = criteriaSum(criteria);
            const isValid = criteria.length === 0 || Math.abs(sum - 1) < 0.001;
            const isBinary = criteria.length === 0;

            return (
              <Card key={slotKey} className={`border ${!isValid ? "border-red-400" : isBinary ? "border-dashed" : "border-green-400"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      Question {i + 1}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (topic: {selectedExam.topics[i % selectedExam.topics.length]})
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isBinary ? (
                        <Badge variant="outline" className="text-xs">Binary (default)</Badge>
                      ) : isValid ? (
                        <Badge className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Sum = 1.0
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Sum = {sum}
                        </Badge>
                      )}
                      {criteria.length > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => clearSlot(slotKey)}>
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {criteria.map((c, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2">
                      <div className="flex-1">
                        <Textarea
                          placeholder="Criterion description (e.g. Student correctly sets up the row reduction)"
                          value={c.description}
                          onChange={(e) => updateCriterion(slotKey, cIdx, "description", e.target.value)}
                          className="text-sm min-h-[56px] resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={c.marks}
                          onChange={(e) => updateCriterion(slotKey, cIdx, "marks", parseFloat(e.target.value) || 0)}
                          className="w-20 text-sm text-center"
                        />
                        <span className="text-xs text-muted-foreground">/ 1</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => removeCriterion(slotKey, cIdx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs mt-1"
                    onClick={() => addCriterion(slotKey)}
                    disabled={sum >= 1 && criteria.length > 0}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Criterion
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
