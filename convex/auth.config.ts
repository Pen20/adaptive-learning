// convex/auth.config.js
export default {
  providers: [
    {
      // Match the domain from your error message exactly
      // domain "https://clerk.ai-math-adaptive.vercel.app.com" in Production
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN ?? "https://informed-shark-76.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
