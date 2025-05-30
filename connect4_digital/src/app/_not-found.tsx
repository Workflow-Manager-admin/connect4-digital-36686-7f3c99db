"use client";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem"
      }}
    >
      <h2>404 — Page Not Found</h2>
      <p>The page you&apos;re looking for does not exist.</p>
    </div>
  );
}
