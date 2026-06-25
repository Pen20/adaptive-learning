/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiDiagnosis from "../aiDiagnosis.js";
import type * as calculusCasUtils from "../calculusCasUtils.js";
import type * as cas from "../cas.js";
import type * as corrections from "../corrections.js";
import type * as courses from "../courses.js";
import type * as debug from "../debug.js";
import type * as didactics from "../didactics.js";
import type * as email from "../email.js";
import type * as evaluation from "../evaluation.js";
import type * as exams from "../exams.js";
import type * as feedback from "../feedback.js";
import type * as grading from "../grading.js";
import type * as gradingPipeline from "../gradingPipeline.js";
import type * as judge from "../judge.js";
import type * as layerTypes from "../layerTypes.js";
import type * as mathAnswerUtils from "../mathAnswerUtils.js";
import type * as migrations from "../migrations.js";
import type * as permissions from "../permissions.js";
import type * as recommendations from "../recommendations.js";
import type * as seed from "../seed.js";
import type * as submissions from "../submissions.js";
import type * as tempAdmin from "../tempAdmin.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiDiagnosis: typeof aiDiagnosis;
  calculusCasUtils: typeof calculusCasUtils;
  cas: typeof cas;
  corrections: typeof corrections;
  courses: typeof courses;
  debug: typeof debug;
  didactics: typeof didactics;
  email: typeof email;
  evaluation: typeof evaluation;
  exams: typeof exams;
  feedback: typeof feedback;
  grading: typeof grading;
  gradingPipeline: typeof gradingPipeline;
  judge: typeof judge;
  layerTypes: typeof layerTypes;
  mathAnswerUtils: typeof mathAnswerUtils;
  migrations: typeof migrations;
  permissions: typeof permissions;
  recommendations: typeof recommendations;
  seed: typeof seed;
  submissions: typeof submissions;
  tempAdmin: typeof tempAdmin;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
