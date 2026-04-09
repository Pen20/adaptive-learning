import { mutation } from "./_generated/server";

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Seed Courses
    const courses = [
      {
        courseId: "linear_algebra",
        title: "Linear Algebra",
        imageUrl: "/course-linear.png",
        description: "Master vector spaces, matrices, and linear transformations.",
      },
      {
        courseId: "differential_calculus",
        title: "Differential Calculus",
        imageUrl: "/course-calculus.png",
        description: "Understand limits, derivatives, and rates of change.",
      },
    ];

    for (const course of courses) {
      const existing = await ctx.db
        .query("courses")
        .withIndex("by_courseId", (q) => q.eq("courseId", course.courseId))
        .unique();
      if (!existing) {
        await ctx.db.insert("courses", course);
      } else {
        await ctx.db.patch(existing._id, course);
      }
    }

    // 2. Seed Topics
    const topics = [
      // Linear Algebra
      { courseId: "linear_algebra", topicId: "linear_equations", title: "Linear Equations", description: "Solve simple linear equations.", chapter: "Systems of Linear Equations" },
      { courseId: "linear_algebra", topicId: "quadratic_equations", title: "Quadratic Equations", description: "Factoring and quadratic formula.", chapter: "Systems of Linear Equations" },
      { courseId: "linear_algebra", topicId: "linear_systems", title: "Linear Systems (No Solution)", description: "Identify systems with no solutions.", chapter: "Systems of Linear Equations" },
      { courseId: "linear_algebra", topicId: "determinants", title: "Determinants", description: "Calculate determinants of 2×2 and 3×3 matrices.", chapter: "Matrices & Determinants" },
      { courseId: "linear_algebra", topicId: "eigenvalues", title: "Eigenvalues & Vectors", description: "Finding eigenvalues of matrices.", chapter: "Eigenvalues & Eigenvectors" },
      { courseId: "linear_algebra", topicId: "eigenvalues_3x3", title: "Eigenvalues of a 3x3 Matrix", description: "Find all eigenvalues for 3x3 matrices.", chapter: "Eigenvalues & Eigenvectors" },
      { courseId: "linear_algebra", topicId: "eigenspaces_2x2", title: "Bases for Eigenspaces (2x2)", description: "Find basis vectors for eigenspaces of 2x2 matrices.", chapter: "Eigenvalues & Eigenvectors" },
      { courseId: "linear_algebra", topicId: "vector_space_axioms", title: "Vector Space Axioms", description: "Identify vector spaces and verify fundamental axioms.", chapter: "Vector Spaces" },
      { courseId: "linear_algebra", topicId: "linear_independence", title: "Linear Independence", description: "Determine if vectors are linearly independent.", chapter: "Vector Spaces" },
      { courseId: "linear_algebra", topicId: "gram_schmidt", title: "Basis & Gram-Schmidt", description: "Eigenbases and orthonormalization.", chapter: "Inner Product Spaces" },
      { courseId: "linear_algebra", topicId: "inner_product_def", title: "Definition Inner Product", description: "Fundamental axioms of inner products.", chapter: "Inner Product Spaces" },
      { courseId: "linear_algebra", topicId: "integral_inner_product", title: "Integral Inner Product", description: "Calculation of inner products for continuous functions.", chapter: "Inner Product Spaces" },
      { courseId: "linear_algebra", topicId: "integral_axioms", title: "Integral Inner Product Axioms", description: "Theoretical proof that the integral satisfies inner product axioms.", chapter: "Inner Product Spaces" },
      { courseId: "linear_algebra", topicId: "polynomial_inner_product", title: "Standard Inner Product on P2", description: "Calculation of standard inner products for polynomial spaces.", chapter: "Inner Product Spaces" },
      
      // Calculus
      { courseId: "differential_calculus", topicId: "limits", title: "Limits", description: "Direct substitution, factoring, and limits at infinity.", chapter: "Limits & Continuity" },
      { courseId: "differential_calculus", topicId: "piecewise_continuity", title: "Piecewise Function Continuity", description: "Analyzing continuity of piecewise defined functions.", chapter: "Limits & Continuity" },
      { courseId: "differential_calculus", topicId: "derivatives", title: "Derivatives", description: "Power rule, chain rule, and rates of change.", chapter: "Derivatives" },
      { courseId: "differential_calculus", topicId: "domain_range", title: "Domain and Range", description: "Finding the domain and range of various functions.", chapter: "Functions" },
    ];

    for (const topic of topics) {
      const existing = await ctx.db
        .query("topics")
        .withIndex("by_topicId", (q) => q.eq("topicId", topic.topicId))
        .unique();
      if (!existing) {
        console.log(`Inserting new topic: ${topic.topicId}`);
        await ctx.db.insert("topics", topic);
      } else {
        console.log(`Patching existing topic: ${topic.topicId}`);
        await ctx.db.patch(existing._id, topic);
      }
    }

    return "Database seeded successfully!";
  },
});
