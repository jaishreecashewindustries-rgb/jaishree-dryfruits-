import React from "react";

function Shimmer({ className }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-100 rounded ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card-luxury flex flex-col h-full">
      <Shimmer className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-3 flex-1">
        <Shimmer className="h-3 w-1/3" />
        <Shimmer className="h-4 w-3/4" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Shimmer key={i} className="h-3 w-3 rounded-full" />
          ))}
        </div>
        <Shimmer className="h-6 w-1/4 mt-2" />
      </div>
    </div>
  );
}

export function SkeletonProductDetail() {
  return (
    <div className="grid md:grid-cols-2 gap-10 mb-16 animate-pulse">
      <Shimmer className="aspect-square w-full rounded-2xl" />
      <div className="space-y-4 py-4">
        <Shimmer className="h-3 w-1/4" />
        <Shimmer className="h-8 w-3/4" />
        <Shimmer className="h-4 w-1/2" />
        <Shimmer className="h-12 w-full mt-4" />
        <Shimmer className="h-12 w-full" />
      </div>
    </div>
  );
}
