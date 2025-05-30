import dynamic from "next/dynamic";

// Use dynamic import with ssr: false for 'use client' in Connect4Container
const Connect4Container = dynamic(() => import("./Connect4Container"), {
  ssr: false,
});

export default function Home() {
  return <Connect4Container />;
}
