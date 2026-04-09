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

export interface GeneratedProblem {
  title?: string;
  statement: string;
  prompt?: string;
  solution: string;
  explanation: string;
  hint: string;
  guide?: { title: string; content: string };
  [key: string]: unknown;
}

export interface TopicEngine {
  generate: () => GeneratedProblem;
  guide?: { title: string; content: string };
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
