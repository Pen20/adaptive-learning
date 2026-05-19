"use client";

import { useEffect, useState } from "react";
import { getAnswerFormat, topicRegistry } from "@/data/topics";
import type { GeneratedProblem } from "@/data/topics";
import type { ProblemData } from "../_types";

function getGeneratedSolution(generated: GeneratedProblem) {
  const domainRangeSolution = [generated.domainSolution, generated.rangeSolution]
    .filter(Boolean)
    .join(", ");

  return generated.solution || domainRangeSolution || "See explanation";
}

function buildProblemData(topicId: string): ProblemData {
  const engine = topicRegistry[topicId];

  if (!engine) {
    return {
      statement: "Problem generator not implemented for this topic yet.",
      hint: "Check back later.",
      solution: "N/A",
      answerFormat: getAnswerFormat(topicId),
    };
  }

  const generated = engine.generate();

  return {
    statement: generated.statement,
    hint: generated.hint,
    solution: getGeneratedSolution(generated),
    explanation: generated.explanation,
    guide: engine.guide,
    title: generated.title,
    answerFormat: getAnswerFormat(topicId, generated),
  };
}

export function useGeneratedProblem(topicId: string) {
  const [problemData, setProblemData] = useState<ProblemData | null>(null);

  useEffect(() => {
    setProblemData(buildProblemData(topicId));
  }, [topicId]);

  return problemData;
}
