"use client";

import dynamic from "next/dynamic";

// Explicit root route for every hosted Xedruo company service.
// The catch-all route still handles React Router paths after the app loads.
const App = dynamic(() => import("@/App.jsx"), { ssr: false });

export default function RootPage() {
  return <App />;
}
