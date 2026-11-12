"use client";

import dynamic from "next/dynamic";

/**
 * The dashboard keeps its data in localStorage, so it renders on the client only.
 * Skipping SSR here avoids a hydration mismatch between server (no storage) and browser.
 */
const Dashboard = dynamic(() => import("./Dashboard"), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

export default function DashboardLoader() {
  return <Dashboard />;
}

function DashboardSkeleton() {
  const block = "animate-pulse rounded-xl bg-card border border-line";
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="mb-6 h-10 w-64 animate-pulse rounded-lg bg-line" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${block} h-28`} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className={`${block} h-80 lg:col-span-3`} />
        <div className={`${block} h-80 lg:col-span-2`} />
      </div>
      <div className={`${block} mt-4 h-96`} />
    </div>
  );
}
