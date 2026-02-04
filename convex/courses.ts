import { query } from "./_generated/server";
import { v } from "convex/values";

export const getCourses = query({
  args: {},
  handler: async (ctx) => {
    // For now, we return hardcoded courses as requested in the requirements.
    // In a real app, these might be in a database table.
    return [
      {
        _id: "linear_algebra",
        title: "Linear Algebra",
        imageUrl: "/course-linear.png",
        description: "Master vector spaces, matrices, and linear transformations.",
      },
      {
        _id: "differential_calculus",
        title: "Differential Calculus",
        imageUrl: "/course-calculus.png",
        description: "Understand limits, derivatives, and rates of change.",
      },
    ];
  },
});

export const getCourseTopics = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    if (args.courseId === "linear_algebra") {
      return [
        { id: "linear_equations", title: "Linear Equations", description: "Solve simple linear equations." },
        { id: "quadratic_equations", title: "Quadratic Equations", description: "Factoring and quadratic formula." },
        { id: "linear_systems", title: "Linear Systems (No Solution)", description: "Identify systems with no solutions." },
        { id: "determinants", title: "Determinants", description: "Calculate determinants of 2x2 matrices." },
        { id: "eigenvalues", title: "Eigenvalues & Vectors", description: "Finding eigenvalues of matrices." },
        { id: "linear_independence", title: "Linear Independence", description: "Determine if vectors are linearly independent." },
        { id: "gram_schmidt", title: "Basis & Gram-Schmidt", description: "Eigenbases and orthonormalization." },
      ];
    } else if (args.courseId === "differential_calculus") {
      return [
        { id: "limits", title: "Limits", description: "Direct substitution, factoring, and limits at infinity." },
        { id: "derivatives", title: "Derivatives", description: "Power rule, chain rule, and rates of change." },
        { id: "piecewise_continuity", title: "Piecewise Function Continuity", description: "Analyzing continuity of piecewise defined functions." },
        { id: "domain_range", title: "Domain and Range", description: "Finding the domain and range of various functions." },
      ];
    }
    return [];
  },
});
