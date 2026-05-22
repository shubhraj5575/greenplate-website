"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function Inner() {
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("from")) {
      toast.success("Footprint saved!", {
        description:
          "Your calculation has been recorded. Here's your dashboard.",
        duration: 5000,
      });
      // Remove the query param without triggering a navigation re-render
      const url = new URL(window.location.href);
      url.searchParams.delete("from");
      window.history.replaceState({}, "", url.pathname + (url.search || ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/** Drop this into any page that can receive ?from=<calcId> after a redirect. */
export function WelcomeToast() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
