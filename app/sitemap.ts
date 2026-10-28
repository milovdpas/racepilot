import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Only the indexable pages. Everything under /app is `noindex`, and listing
 * a noindexed URL in a sitemap is a contradiction Search Console reports as an
 * error rather than ignoring.
 *
 * `lastModified` is hardcoded per URL rather than `new Date()`: a sitemap whose
 * dates change on every deploy teaches Google that the field means nothing, and
 * it stops using it to schedule crawls. Bump a date when that page's content
 * actually changes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date("2026-08-08"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date("2026-10-28"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms_of_service`,
      lastModified: new Date("2026-10-28"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
