'use client';

import dynamic from 'next/dynamic';

const SimulationInterface = dynamic(
  () => import("./simulation-interface"),
  { ssr: false }
);

export default function SimulationWrapper() {
  return <SimulationInterface />;
} 