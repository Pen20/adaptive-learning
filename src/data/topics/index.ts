import { limitsLogic } from "./calculus/limits";
import { derivativesLogic } from "./calculus/derivatives";
import { piecewiseLogic } from "./calculus/piecewise";
import { domainRangeLogic } from "./calculus/domain-range";

import { quadraticLogic } from "./linear/quadratic";
import { systemsLogic } from "./linear/systems";
import { linearEquationLogic } from "./linear/linear-eq";
import { eigenvalueLogic } from "./linear/eigenvalues";
import { determinantLogic } from "./linear/determinants";
import { independenceLogic } from "./linear/independence";
import { gramSchmidtLogic } from "./linear/gram_schmidt";
import { innerProductLogic } from "./linear/inner_products";
import { integralInnerProductLogic } from "./linear/integral_inner_products";
import { integralAxiomsLogic } from "./linear/integral_axioms";
import { polynomialInnerProductLogic } from "./linear/polynomial_inner_products";
import { eigenvalues3x3Logic } from "./linear/eigenvalues_3x3";
import { eigenspaces2x2Logic } from "./linear/eigenspaces_2x2";
import { vectorSpaceAxiomsLogic } from "./linear/vector_space_axioms";
import type { ExercisePedagogyInstance } from "@/data/pedagogy";

export interface AnswerFormat {
  placeholder: string;
  instruction: string;
  alternatives?: string[];
  fields?: {
    key: string;
    label: string;
    operator?: string;
    placeholder?: string;
  }[];
}

export interface GeneratedProblem {
  title?: string;
  statement: string;
  prompt?: string;
  solution: string;
  explanation: string;
  hint: string;
  guide?: { title: string; content: string };
  answerFormat?: AnswerFormat;
  reasoningSteps?: string;
  pedagogy?: ExercisePedagogyInstance;
  [key: string]: unknown;
}

export interface TopicEngine {
  generate: () => GeneratedProblem;
  guide?: { title: string; content: string };
}

const defaultAnswerFormat: AnswerFormat = {
  placeholder: "Example: x = 3",
  instruction: "Give the final answer in standard mathematical notation. Include the variable name when it helps remove ambiguity.",
};

export const defaultAnswerFormats: Record<string, AnswerFormat> = {
  limits: {
    placeholder: "Example: 5",
    instruction: "Give the simplified limit value. If the limit does not exist, write DNE and briefly justify it in your reasoning.",
    alternatives: ["5", "limit = 5", "DNE"],
    fields: [{ key: "limit", label: "limit", placeholder: "5" }],
  },
  limits_continuity: {
    placeholder: "Example: 5",
    instruction: "Give the simplified limit value. If the limit does not exist, write DNE and briefly justify it in your reasoning.",
    alternatives: ["5", "limit = 5", "DNE"],
    fields: [{ key: "limit", label: "limit", placeholder: "5" }],
  },
  derivatives: {
    placeholder: "Example: f'(x) = 6x",
    instruction: "Give the derivative as a simplified expression. You may write only the expression if the variable is clear.",
    alternatives: ["f'(x) = 6x", "6x", "dy/dx = 6x"],
    fields: [{ key: "derivative", label: "f'(x)", placeholder: "6x" }],
  },
  derivatives_practice: {
    placeholder: "Example: f'(x) = 6x",
    instruction: "Give the derivative as a simplified expression. You may write only the expression if the variable is clear.",
    alternatives: ["f'(x) = 6x", "6x", "dy/dx = 6x"],
    fields: [{ key: "derivative", label: "f'(x)", placeholder: "6x" }],
  },
  piecewise_continuity: {
    placeholder: "Example: continuous",
    instruction: "State continuous or discontinuous, and explain the one-sided values in your reasoning.",
    alternatives: ["continuous", "discontinuous", "not continuous"],
  },
  continuity: {
    placeholder: "Example: continuous",
    instruction: "State continuous or discontinuous, and explain the one-sided values in your reasoning.",
    alternatives: ["continuous", "discontinuous", "not continuous"],
  },
  piecewise: {
    placeholder: "Example: continuous",
    instruction: "State continuous or discontinuous, and explain the one-sided values in your reasoning.",
    alternatives: ["continuous", "discontinuous", "not continuous"],
  },
  domain_range: {
    placeholder: "Example: Domain: R, Range: [2, infinity)",
    instruction: "Give both domain and range using interval notation or clear set notation.",
    alternatives: ["Domain: (-infinity, infinity), Range: [2, infinity)", "D = R, R = [2, infinity)"],
    fields: [
      { key: "domain", label: "Domain", placeholder: "(-infinity, infinity)" },
      { key: "range", label: "Range", placeholder: "[2, infinity)" },
    ],
  },
  quadratic_equations: {
    placeholder: "Example: x in {-3, 4}",
    instruction: "Give all solutions as a set of roots. Set notation is accepted, and order does not matter.",
    alternatives: ["x in {-3, 4}", "{-3, 4}", "x = -3, 4", "x = -3 and x = 4"],
    fields: [
      { key: "x1", label: "x_1", placeholder: "-3" },
      { key: "x2", label: "x_2", placeholder: "4" },
    ],
  },
  quadratic: {
    placeholder: "Example: x in {-3, 4}",
    instruction: "Give all solutions as a set of roots. Set notation is accepted, and order does not matter.",
    alternatives: ["x in {-3, 4}", "{-3, 4}", "x = -3, 4", "x = -3 and x = 4"],
    fields: [
      { key: "x1", label: "x_1", placeholder: "-3" },
      { key: "x2", label: "x_2", placeholder: "4" },
    ],
  },
  linear_equations: {
    placeholder: "Example: x = 3",
    instruction: "Give the solved value of x. You may write x = 3 or just 3 if your reasoning makes the variable clear.",
    alternatives: ["x = 3", "3"],
    fields: [{ key: "x", label: "x", placeholder: "3" }],
  },
  equations: {
    placeholder: "Example: x = 3",
    instruction: "Give the solved value of x. You may write x = 3 or just 3 if your reasoning makes the variable clear.",
    alternatives: ["x = 3", "3"],
    fields: [{ key: "x", label: "x", placeholder: "3" }],
  },
  linear_systems: {
    placeholder: "Example: k = 2",
    instruction: "Give the parameter value requested by the system. Include the parameter name when possible.",
    alternatives: ["k = 2", "2"],
    fields: [{ key: "k", label: "k", placeholder: "2" }],
  },
  systems: {
    placeholder: "Example: k = 2",
    instruction: "Give the parameter value requested by the system. Include the parameter name when possible.",
    alternatives: ["k = 2", "2"],
    fields: [{ key: "k", label: "k", placeholder: "2" }],
  },
  eigenvalues: {
    placeholder: "Example: lambda in {2, 5}",
    instruction: "Give all eigenvalues as a set. Set notation is accepted, and order does not matter.",
    alternatives: ["lambda in {2, 5}", "{2, 5}", "lambda = 2, 5"],
    fields: [
      { key: "lambda1", label: "lambda_1", placeholder: "2" },
      { key: "lambda2", label: "lambda_2", placeholder: "5" },
    ],
  },
  eigenvalues_3x3: {
    placeholder: "Example: lambda in {1, 2 + sqrt(3), 2 - sqrt(3)}",
    instruction: "Give all eigenvalues as a set. Set notation is accepted, and order does not matter.",
    alternatives: ["lambda in {1, 2 + sqrt(3), 2 - sqrt(3)}", "{1, 2 +/- sqrt(3)}", "1, 2 + sqrt(3), 2 - sqrt(3)"],
    fields: [
      { key: "lambda1", label: "lambda_1", placeholder: "1" },
      { key: "lambda2", label: "lambda_2", placeholder: "2 + sqrt(3)" },
      { key: "lambda3", label: "lambda_3", placeholder: "2 - sqrt(3)" },
    ],
  },
  determinants: {
    placeholder: "Example: det(A) = 12",
    instruction: "Give the requested determinant value or parameter condition exactly. Use det(A) = n, k = n, or k != n as appropriate.",
    alternatives: ["det(A) = 12", "12", "k = 3", "k != 3"],
    fields: [{ key: "value", label: "answer", placeholder: "12 or k != 3" }],
  },
  matrices: {
    placeholder: "Example: det(A) = 12",
    instruction: "Give the requested determinant value or parameter condition exactly. Use det(A) = n, k = n, or k != n as appropriate.",
    alternatives: ["det(A) = 12", "12", "k = 3", "k != 3"],
    fields: [{ key: "value", label: "answer", placeholder: "12 or k != 3" }],
  },
  eigenspaces_2x2: {
    placeholder: "Example: char eq, lambda set, bases",
    instruction: "Give the characteristic equation, all eigenvalues, and a basis for each eigenspace. Use braces for bases when helpful.",
    alternatives: ["lambda in {1, 4}; E_1 = span{[1,0]}; E_4 = span{[0,1]}"],
  },
  vector_space_axioms: {
    placeholder: "Example: Yes, it is a vector space",
    instruction: "State whether the set is a vector space, then name the axiom that proves or fails it in your reasoning.",
    alternatives: ["Yes, vector space", "No, not a vector space"],
  },
  linear_independence: {
    placeholder: "Example: w = (1, -2, 3)",
    instruction: "Give a valid vector or condition requested by the problem. Vector notation, column notation, and tuple notation are accepted.",
    alternatives: ["w = (1, -2, 3)", "w = [1, -2, 3]", "w not in span(u, v)"],
  },
  gram_schmidt: {
    placeholder: "Example: lambda in {2, 5}; vectors ...",
    instruction: "Give the requested eigenvalues, basis, or orthogonal vectors as a clearly labeled list. Set notation is accepted for eigenvalues.",
    alternatives: ["lambda in {2, 5}", "u1 = ..., u2 = ..."],
  },
  inner_product_def: {
    placeholder: "Example: yes, satisfies all axioms",
    instruction: "State whether the property holds, and identify the relevant inner product axiom in your reasoning.",
    alternatives: ["yes", "no", "satisfies symmetry", "fails positivity"],
  },
  integral_inner_product: {
    placeholder: "Example: <f,g> = 12",
    instruction: "Give the computed inner product value or the requested axiom conclusion.",
    alternatives: ["<f,g> = 12", "12"],
    fields: [{ key: "innerProduct", label: "<f,g>", placeholder: "12" }],
  },
  integral_axioms: {
    placeholder: "Example: symmetry holds",
    instruction: "State the axiom conclusion clearly, then justify it in your reasoning.",
    alternatives: ["symmetry holds", "additivity holds", "positivity holds"],
  },
  polynomial_inner_product: {
    placeholder: "Example: <p,q> = 12",
    instruction: "Give the computed polynomial inner product value as a simplified number.",
    alternatives: ["<p,q> = 12", "12"],
    fields: [{ key: "innerProduct", label: "<p,q>", placeholder: "12" }],
  },
};

export function getAnswerFormat(topicId: string, generated?: Pick<GeneratedProblem, "answerFormat">): AnswerFormat {
  return generated?.answerFormat ?? defaultAnswerFormats[topicId] ?? defaultAnswerFormat;
}

export const topicRegistry: Record<string, TopicEngine> = {
  "limits": limitsLogic,
  "limits_continuity": limitsLogic,
  "derivatives": derivativesLogic,
  "derivatives_practice": derivativesLogic,
  "piecewise_continuity": piecewiseLogic,
  "domain_range": domainRangeLogic,

  // Linear Algebra Topics
  "quadratic_equations": quadraticLogic,
  "linear_systems": systemsLogic,
  "linear_equations": linearEquationLogic,
  "eigenvalues": eigenvalueLogic,
  "determinants": determinantLogic,
  "linear_independence": independenceLogic,
  "gram_schmidt": gramSchmidtLogic,
  "inner_product_def": innerProductLogic,
  "integral_inner_product": integralInnerProductLogic,
  "integral_axioms": integralAxiomsLogic,
  "polynomial_inner_product": polynomialInnerProductLogic,
  "eigenvalues_3x3": eigenvalues3x3Logic,
  "eigenspaces_2x2": eigenspaces2x2Logic,
  "vector_space_axioms": vectorSpaceAxiomsLogic,

  // Aliases for Admin Panel compatibility
  "systems": systemsLogic,
  "equations": linearEquationLogic,
  "quadratic": quadraticLogic,
  "matrices": determinantLogic,
  "continuity": piecewiseLogic,
  "piecewise": piecewiseLogic,
};
