import * as React from "react";

export const RatingStar = ({ active }: { active: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="m12 2.5 2.91 5.9 6.51.95-4.71 4.59 1.11 6.48L12 17.37 6.18 20.42l1.11-6.48L2.58 9.35l6.51-.95L12 2.5Z" />
  </svg>
);
