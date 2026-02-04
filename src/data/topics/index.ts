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

// Map the dynamic topicId (from URL) to the specific math engine
export const topicRegistry: Record<string, any> = {
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
  
  // Aliases for Admin Panel compatibility
  "systems": systemsLogic,
  "equations": linearEquationLogic,
  "quadratic": quadraticLogic,
  "matrices": determinantLogic,
  "continuity": piecewiseLogic,
  "piecewise": piecewiseLogic,
};
