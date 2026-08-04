"use client"

/**
 * Last resort: a failure in the root layout itself, where error.tsx can't
 * mount. It has to render its own <html> and <body>, and can't rely on the
 * theme provider or any app styling being available.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100svh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "24rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.125rem", margin: "0 0 0.5rem" }}>
            Life OS couldn&apos;t start
          </h1>
          <p style={{ fontSize: "0.875rem", opacity: 0.7, margin: "0 0 1rem" }}>
            Something failed before the app could load. Reloading usually clears
            it.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid currentColor",
              background: "transparent",
              cursor: "pointer",
              font: "inherit",
              fontSize: "0.875rem",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "monospace",
                fontSize: "0.6875rem",
                opacity: 0.5,
              }}
            >
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
