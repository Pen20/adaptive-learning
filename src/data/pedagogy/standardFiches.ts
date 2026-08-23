import type {
  PedagogicalMisconception,
  TopicEvaluationFiche,
} from "./schema";

type FicheConfig = {
  topicId: string;
  prefix: string;
  title: string;
  objective: string;
  taskName: string;
  technique: string;
  techniqueDescription: string;
  requiredEvidence: string[];
  misconceptions: Array<{
    label: string;
    classification: PedagogicalMisconception["classification"];
    indicators: string[];
    prompt: string;
  }>;
};

function createFiche(config: FicheConfig): TopicEvaluationFiche {
  const { prefix } = config;
  return {
    schemaVersion: "1.1",
    ficheId: `${config.topicId}-evaluation`,
    ficheVersion: "1.0.0",
    topicId: config.topicId,
    title: `Topic-level fiche pédagogique d’évaluation — ${config.title}`,
    learningObjectives: [
      { objectiveId: `${prefix}-O1`, description: config.objective },
      { objectiveId: `${prefix}-O2`, description: "Justify the method with mathematically valid intermediate work." },
    ],
    prerequisites: [
      { prerequisiteId: `${prefix}-P1`, description: "Use the prerequisite notation, algebra, and definitions accurately." },
    ],
    taskTypes: [
      {
        taskTypeId: `${prefix}-SOLVE`,
        name: config.taskName,
        objectiveIds: [`${prefix}-O1`, `${prefix}-O2`],
        acceptedTechniques: [
          {
            techniqueId: `${prefix.toLowerCase()}-standard-method`,
            label: config.technique,
            reasoningComponents: [
              {
                componentId: `${prefix}-S1`,
                description: config.techniqueDescription,
                required: true,
                acceptableEvidence: config.requiredEvidence,
                insufficientEvidence: ["A final answer with no relevant mathematical justification"],
              },
              {
                componentId: `${prefix}-S2`,
                description: "Carry the method through to the requested conclusion.",
                required: true,
                acceptableEvidence: [
                  "Correct intermediate transformations leading to the conclusion",
                  "An equivalent condensed derivation with the essential logical condition stated",
                ],
                insufficientEvidence: ["Work that stops before answering the question asked"],
              },
            ],
          },
        ],
        reasoningCriterionIds: [`${prefix}-C1`, `${prefix}-C2`],
      },
    ],
    evaluationRubric: {
      finalAnswerWeight: 0.5,
      reasoningWeight: 0.5,
      reasoningCriteria: [
        { criterionId: `${prefix}-C1`, description: "Select and apply a valid mathematical method.", weight: 0.25 },
        { criterionId: `${prefix}-C2`, description: "Support the requested conclusion with correct intermediate reasoning.", weight: 0.25 },
      ],
    },
    reasoningStatuses: [
      { status: "correct", definition: "The method and conclusion are mathematically valid.", penalizesReasoning: false },
      { status: "correct_but_incomplete", definition: "The mathematics shown is valid but a required condition or conclusion is missing.", penalizesReasoning: true },
      { status: "incorrect", definition: "A genuine mathematical divergence prevents the reasoning from justifying the conclusion.", penalizesReasoning: true },
      { status: "missing", definition: "No assessable reasoning was submitted.", penalizesReasoning: true },
      { status: "not_applicable", definition: "The task does not require assessable reasoning.", penalizesReasoning: false },
    ],
    equivalencePolicy: {
      mustCheckBeforeDeclaringError: true,
      acceptedTransformations: [
        "equivalent symbolic forms",
        "expanded and factored forms",
        "equivalent fractions",
        "reordered sums, products, sets, or solution lists",
        "standard equivalent mathematical notation",
      ],
      rule: "A representational difference is not an error unless it changes the value, solution set, domain, sign, condition, or logical meaning.",
    },
    scoringPolicy: {
      mode: "binary",
      maximumReasoningScore: 0.5,
      fullCreditRule: "Award 0.5 when the submitted reasoning contains a valid method that justifies the requested conclusion.",
      zeroCreditRule: "Award 0 when a genuine error or required omission prevents the reasoning from justifying the conclusion.",
      criteriaPurpose: "diagnosis_and_feedback",
    },
    feedbackPolicy: {
      acknowledgeCorrectWorkFirst: true,
      identifyFirstGenuineDivergence: true,
      doNotMentionInternalStepIds: true,
      doNotCallEquivalentExpressionsErrors: true,
      distinguishIncompleteFromIncorrect: true,
      maximumActionableCorrections: 1,
      preferredReasoningPhrases: {
        incorrect: "Your reasoning diverges when...",
        incomplete: "Your reasoning is correct up to..., but it stops before...",
        correct: "Your reasoning correctly...",
      },
    },
    misconceptions: config.misconceptions.map((item, index) => ({
      misconceptionId: `${prefix}-M${index + 1}`,
      label: item.label,
      classification: item.classification,
      observableIndicators: item.indicators,
      prerequisiteIds: [`${prefix}-P1`],
      feedbackStrategy: {
        acknowledge: "Acknowledge any mathematically valid setup before addressing the error.",
        prompt: item.prompt,
        avoidGivingAnswerImmediately: true,
      },
      remediationStrategy: `${config.topicId}-${index + 1}-guided-repair`,
    })),
  };
}

const configs: FicheConfig[] = [
  { topicId: "limits", prefix: "LIM", title: "Limits", objective: "Evaluate limits using valid algebraic, graphical, or asymptotic reasoning.", taskName: "Evaluate and justify a limit", technique: "Limit evaluation", techniqueDescription: "Identify the limiting behavior and apply a valid limit technique.", requiredEvidence: ["Valid substitution when applicable", "A justified algebraic simplification or one-sided/asymptotic analysis"], misconceptions: [
    { label: "Invalid direct substitution", classification: "procedural_error", indicators: ["Treats an indeterminate form as the limit"], prompt: "What does direct substitution produce, and does that value permit a conclusion?" },
    { label: "One-sided behavior ignored", classification: "conceptual_error", indicators: ["Declares a two-sided limit without comparing sides"], prompt: "What value is approached from each side?" },
  ] },
  { topicId: "derivatives", prefix: "DER", title: "Derivatives", objective: "Differentiate functions using valid derivative rules and simplification.", taskName: "Compute and justify a derivative", technique: "Differentiation rules", techniqueDescription: "Select the applicable derivative rule and apply it to every relevant term or factor.", requiredEvidence: ["Correct identification of the derivative rule", "Correct differentiation of component expressions"], misconceptions: [
    { label: "Derivative rule misapplied", classification: "procedural_error", indicators: ["Product, quotient, or chain rule applied incompletely"], prompt: "Which derivative rule matches the outer structure of the function?" },
    { label: "Inner derivative omitted", classification: "incomplete_reasoning", indicators: ["Composite function differentiated without the inner derivative"], prompt: "After differentiating the outer function, which inner derivative must multiply it?" },
  ] },
  { topicId: "piecewise_continuity", prefix: "PWC", title: "Piecewise Continuity", objective: "Determine continuity by comparing one-sided limits and the function value.", taskName: "Test continuity of a piecewise function", technique: "Three-value continuity test", techniqueDescription: "Compute the left limit, right limit, and function value at the junction.", requiredEvidence: ["Both one-sided limits", "Comparison with the defined function value"], misconceptions: [
    { label: "One-sided limit omitted", classification: "incomplete_reasoning", indicators: ["Only one branch is evaluated at the junction"], prompt: "What do the left-hand and right-hand limits equal separately?" },
    { label: "Limit confused with function value", classification: "conceptual_error", indicators: ["Continuity inferred from the point value alone"], prompt: "Do the common limit and the function value agree?" },
  ] },
  { topicId: "domain_range", prefix: "DOR", title: "Domain and Range", objective: "Determine the domain and range while respecting algebraic restrictions and output behavior.", taskName: "Find domain and range", technique: "Restriction and output analysis", techniqueDescription: "Identify input restrictions and characterize all attainable output values.", requiredEvidence: ["Relevant denominator, radical, logarithm, or structural restrictions", "A justified description of attainable outputs"], misconceptions: [
    { label: "Domain restriction omitted", classification: "incomplete_reasoning", indicators: ["Includes an input that makes the expression undefined"], prompt: "Which inputs make a denominator zero or violate another definition condition?" },
    { label: "Range inferred from domain", classification: "conceptual_error", indicators: ["Reports the same set for domain and range without output analysis"], prompt: "Which output values can the function actually attain?" },
  ] },
  { topicId: "quadratic_equations", prefix: "QUA", title: "Quadratic Equations", objective: "Find all roots of a quadratic equation using a valid algebraic method.", taskName: "Solve a quadratic equation", technique: "Quadratic solution method", techniqueDescription: "Transform the equation to standard form and use factoring, completing the square, or the quadratic formula.", requiredEvidence: ["A valid standard-form equation", "A correct factorization or discriminant-based calculation"], misconceptions: [
    { label: "Incomplete root set", classification: "incomplete_reasoning", indicators: ["Only one of two roots is reported"], prompt: "Does the factorization or ± symbol produce another root?" },
    { label: "Quadratic formula sign error", classification: "calculation_error", indicators: ["Uses the wrong sign for b or the discriminant"], prompt: "What are a, b, and c in standard form before substitution?" },
  ] },
  { topicId: "linear_systems", prefix: "SYS", title: "Linear Systems", objective: "Solve or characterize a linear system using valid elimination, substitution, or rank reasoning.", taskName: "Solve or classify a linear system", technique: "Elimination or substitution", techniqueDescription: "Combine equations without changing the solution set and interpret the resulting condition.", requiredEvidence: ["Valid row/equation operations", "A conclusion consistent with the reduced system"], misconceptions: [
    { label: "Invalid elimination operation", classification: "procedural_error", indicators: ["An equation operation changes the solution set"], prompt: "Which reversible operation eliminates the chosen variable?" },
    { label: "System classification reversed", classification: "conceptual_error", indicators: ["Contradiction or free variable is interpreted incorrectly"], prompt: "Does the reduced equation represent a contradiction, an identity, or a pivot?" },
  ] },
  { topicId: "linear_equations", prefix: "LEQ", title: "Linear Equations", objective: "Solve a linear equation using equivalent transformations.", taskName: "Solve a linear equation", technique: "Equivalent equation transformations", techniqueDescription: "Apply the same reversible operation to both sides until the variable is isolated.", requiredEvidence: ["Balanced operations on both sides", "Correct isolation of the variable"], misconceptions: [
    { label: "Unbalanced equation operation", classification: "procedural_error", indicators: ["An operation is applied to only one side"], prompt: "What operation must be applied to both sides?" },
    { label: "Sign error while isolating variable", classification: "calculation_error", indicators: ["A term changes sides with an incorrect sign"], prompt: "Can you perform the inverse operation explicitly on both sides?" },
  ] },
  { topicId: "eigenvalues", prefix: "EIG", title: "Eigenvalues", objective: "Determine all eigenvalues from the characteristic equation.", taskName: "Compute eigenvalues", technique: "Characteristic polynomial", techniqueDescription: "Form and solve the characteristic equation det(A − λI) = 0.", requiredEvidence: ["Correct characteristic matrix or polynomial", "All roots of the characteristic equation"], misconceptions: [
    { label: "Characteristic matrix sign error", classification: "procedural_error", indicators: ["Forms A + λI without justification or alters off-diagonal entries"], prompt: "Which entries change when forming A − λI?" },
    { label: "Eigenvalue omitted", classification: "incomplete_reasoning", indicators: ["Not all characteristic roots are reported"], prompt: "What are all roots, including repeated roots, of the characteristic polynomial?" },
  ] },
  { topicId: "linear_independence", prefix: "LIN", title: "Linear Independence", objective: "Determine linear independence or construct vectors satisfying span conditions.", taskName: "Analyze linear independence", technique: "Homogeneous relation or span test", techniqueDescription: "Analyze whether a linear combination equals zero only trivially or whether a target lies in a span.", requiredEvidence: ["A valid coefficient equation or rank argument", "A conclusion tied to trivial/nontrivial solutions"], misconceptions: [
    { label: "Independence condition reversed", classification: "conceptual_error", indicators: ["A nontrivial zero combination is called independent"], prompt: "Does the homogeneous coefficient system have only the trivial solution?" },
    { label: "Span membership unsupported", classification: "incomplete_reasoning", indicators: ["Claims membership without coefficients or rank evidence"], prompt: "Which coefficients express the vector as the required linear combination?" },
  ] },
  { topicId: "gram_schmidt", prefix: "GRS", title: "Gram–Schmidt", objective: "Construct an orthogonal or orthonormal family using projection subtraction.", taskName: "Apply Gram–Schmidt", technique: "Projection subtraction", techniqueDescription: "Subtract projections onto previously constructed orthogonal vectors and normalize when requested.", requiredEvidence: ["Correct projection coefficients", "Orthogonality verification or correct normalization"], misconceptions: [
    { label: "Projection denominator omitted", classification: "procedural_error", indicators: ["Uses ⟨v,u⟩u without dividing by ⟨u,u⟩"], prompt: "What denominator appears in the projection onto a non-unit vector?" },
    { label: "Normalization performed incorrectly", classification: "calculation_error", indicators: ["Divides by the squared norm instead of the norm"], prompt: "Which norm must divide an orthogonal vector to make it unit length?" },
  ] },
  { topicId: "inner_product_def", prefix: "IPD", title: "Inner Product Definition", objective: "Verify or refute inner-product axioms for a proposed operation.", taskName: "Test an inner-product axiom", technique: "Axiom verification", techniqueDescription: "Evaluate the relevant symmetry, linearity, or positive-definiteness condition.", requiredEvidence: ["The applicable axiom stated correctly", "A general verification or valid counterexample"], misconceptions: [
    { label: "Axiom checked only on one example", classification: "incomplete_reasoning", indicators: ["A universal property is accepted from a single case"], prompt: "Can you justify the property generally, or produce a counterexample?" },
    { label: "Positivity confused with definiteness", classification: "conceptual_error", indicators: ["Checks nonnegativity but not the zero-only condition"], prompt: "When may ⟨v,v⟩ equal zero?" },
  ] },
  { topicId: "integral_inner_product", prefix: "IIP", title: "Integral Inner Products", objective: "Compute integral inner products and interpret their properties.", taskName: "Compute an integral inner product", technique: "Product integration", techniqueDescription: "Form the product of the functions and integrate it over the specified interval.", requiredEvidence: ["Correct integrand and bounds", "Correct antiderivative and endpoint evaluation"], misconceptions: [
    { label: "Functions not multiplied", classification: "procedural_error", indicators: ["Integrates f and g separately instead of fg"], prompt: "What integrand is defined by ⟨f,g⟩?" },
    { label: "Bounds evaluated incorrectly", classification: "calculation_error", indicators: ["Endpoint subtraction or signs are wrong"], prompt: "What is F(b) − F(a) for your antiderivative?" },
  ] },
  { topicId: "integral_axioms", prefix: "IAX", title: "Integral Inner-Product Axioms", objective: "Establish inner-product axioms for integral-defined operations.", taskName: "Verify an integral inner-product axiom", technique: "Integral property proof", techniqueDescription: "Use linearity, symmetry of multiplication, or nonnegativity of squared functions as appropriate.", requiredEvidence: ["Correct integral property", "Conclusion connected explicitly to the target axiom"], misconceptions: [
    { label: "Integral property misapplied", classification: "procedural_error", indicators: ["Linearity or scalar extraction is used incorrectly"], prompt: "Which standard integral identity establishes this axiom?" },
    { label: "Positive definiteness incomplete", classification: "incomplete_reasoning", indicators: ["Nonnegativity shown without equality characterization"], prompt: "When can the integral of the squared function equal zero?" },
  ] },
  { topicId: "polynomial_inner_product", prefix: "PIP", title: "Polynomial Inner Products", objective: "Compute and analyze inner products of polynomials under the stated definition.", taskName: "Compute a polynomial inner product", technique: "Coefficient or evaluation computation", techniqueDescription: "Apply the given polynomial inner-product definition term by term.", requiredEvidence: ["Correct extraction/evaluation of polynomial data", "Correct combination according to the stated definition"], misconceptions: [
    { label: "Wrong inner-product definition used", classification: "conceptual_error", indicators: ["Uses coefficient dot product when an evaluation/integral rule was specified"], prompt: "What exact definition of ⟨p,q⟩ is given in this problem?" },
    { label: "Polynomial coefficient omitted", classification: "calculation_error", indicators: ["A coefficient or term is missing from the computation"], prompt: "Which coefficient or evaluation contributes from each polynomial term?" },
  ] },
  { topicId: "eigenvalues_3x3", prefix: "EI3", title: "3×3 Eigenvalues", objective: "Determine all eigenvalues of a 3×3 matrix from a valid characteristic-polynomial strategy.", taskName: "Compute 3×3 eigenvalues", technique: "Structured characteristic polynomial", techniqueDescription: "Exploit matrix structure or compute det(A − λI), then find all roots with multiplicity.", requiredEvidence: ["A valid characteristic factorization", "All three roots counted with multiplicity"], misconceptions: [
    { label: "Characteristic factor omitted", classification: "incomplete_reasoning", indicators: ["A block, triangular diagonal factor, or repeated factor is missing"], prompt: "How does the matrix structure factor the characteristic polynomial?" },
    { label: "Algebraic multiplicity ignored", classification: "conceptual_error", indicators: ["Repeated eigenvalue is reported with incorrect multiplicity"], prompt: "What is the multiplicity of each root in the characteristic polynomial?" },
  ] },
  { topicId: "eigenspaces_2x2", prefix: "ESP", title: "2×2 Eigenspaces", objective: "Find eigenvalues and valid bases for their eigenspaces.", taskName: "Compute eigenspaces", technique: "Null-space method", techniqueDescription: "For each eigenvalue, solve (A − λI)v = 0 and state a basis of the solution space.", requiredEvidence: ["Correct eigenvalue-specific homogeneous system", "A nonzero spanning vector or basis for each eigenspace"], misconceptions: [
    { label: "Eigenvector equation solved inhomogeneously", classification: "procedural_error", indicators: ["Uses (A − λI)v = λ or another nonzero right side"], prompt: "What right-hand side defines the eigenspace null space?" },
    { label: "Zero vector used as basis", classification: "conceptual_error", indicators: ["Reports only the zero vector as an eigenvector"], prompt: "Which nonzero vector spans the null space?" },
  ] },
  { topicId: "vector_space_axioms", prefix: "VSA", title: "Vector-Space Axioms", objective: "Determine whether a set with given operations is a vector space using axioms or a decisive counterexample.", taskName: "Verify vector-space structure", technique: "Axiom verification or counterexample", techniqueDescription: "Check closure and the relevant vector-space axioms, stopping at a valid decisive failure when appropriate.", requiredEvidence: ["A correctly stated applicable axiom", "A general verification or explicit counterexample"], misconceptions: [
    { label: "Closure assumed", classification: "incomplete_reasoning", indicators: ["Operations are used without checking results remain in the set"], prompt: "Does the proposed operation keep every result inside the set?" },
    { label: "Ordinary operations substituted", classification: "conceptual_error", indicators: ["Uses standard addition/scalar multiplication instead of the defined operations"], prompt: "What are the addition and scalar multiplication operations specified here?" },
  ] },
];

export const standardTopicFiches = configs.map(createFiche);
