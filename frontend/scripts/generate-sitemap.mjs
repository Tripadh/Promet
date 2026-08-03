import fs from "node:fs";
import path from "node:path";
import { publicRoutes } from "../src/seo/publicRoutes.js";
import { SITE_URL } from "../src/seo/seoConfig.js";

const lastmod = new Date().toISOString().split("T")[0];
const urls = publicRoutes
  .map(
    ({ path: routePath, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${routePath === "/" ? "/" : routePath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const outputPath = path.resolve(process.cwd(), "public/sitemap.xml");
fs.writeFileSync(outputPath, xml, "utf8");
console.log(`Generated sitemap at ${outputPath}`);
