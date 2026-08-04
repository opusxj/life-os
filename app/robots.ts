import type { MetadataRoute } from "next"

/**
 * Nothing here is for the public. The proxy already redirects anonymous
 * traffic to /sign-in, so this isn't a data leak — but an indexed sign-in page
 * on a household finance app is an invitation to credential stuffing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  }
}
