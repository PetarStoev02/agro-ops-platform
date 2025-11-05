"use client";

// This catch-all page allows TanStack Router to handle all routes
// When a user refreshes any page, Next.js will serve this page,
// and TanStack Router (rendered in _app.tsx) will handle the routing
// We return null because _app.tsx wraps everything with TanStackRouterProvider
export default function CatchAllPage() {
  // Return null - TanStack Router in _app.tsx will handle the routing
  // The router provider will render the appropriate route component
  return null;
}
