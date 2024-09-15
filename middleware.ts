import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/"],
  afterAuth(auth, req, evt) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Redirect logged in users to /chat if they're trying to access the home page
    if (auth.userId && req.nextUrl.pathname === "/") {
      return Response.redirect(new URL("/chat", req.url));
    }
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};