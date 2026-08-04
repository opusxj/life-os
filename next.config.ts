import type { NextConfig } from "next"

/**
 * A private household finance app, so: not embeddable, not sniffable, and it
 * leaks as little as possible on the way out. Vercel supplies HSTS on its own
 * domains; everything below is ours. No CSP yet — Next injects inline styles
 * and scripts, so a real one needs nonce plumbing rather than a guess.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
