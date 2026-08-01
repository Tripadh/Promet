import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSeoForPath } from "../../seo/seoConfig";

const upsertMetaTag = (selector, attrs) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const upsertLinkTag = (selector, attrs) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    const seo = getSeoForPath(location.pathname);

    document.documentElement.setAttribute("lang", "en");
    document.title = seo.title;

    upsertMetaTag('meta[name="description"]', { name: "description", content: seo.description });
    upsertMetaTag('meta[name="robots"]', { name: "robots", content: seo.robots });

    upsertMetaTag('meta[property="og:title"]', { property: "og:title", content: seo.title });
    upsertMetaTag('meta[property="og:description"]', { property: "og:description", content: seo.description });
    upsertMetaTag('meta[property="og:image"]', { property: "og:image", content: seo.ogImage });
    upsertMetaTag('meta[property="og:url"]', { property: "og:url", content: seo.canonicalUrl });
    upsertMetaTag('meta[property="og:type"]', { property: "og:type", content: seo.ogType || "website" });
    upsertMetaTag('meta[property="og:site_name"]', { property: "og:site_name", content: seo.siteName });

    upsertMetaTag('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMetaTag('meta[name="twitter:title"]', { name: "twitter:title", content: seo.title });
    upsertMetaTag('meta[name="twitter:description"]', { name: "twitter:description", content: seo.description });
    upsertMetaTag('meta[name="twitter:image"]', { name: "twitter:image", content: seo.ogImage });

    upsertLinkTag('link[rel="canonical"]', { rel: "canonical", href: seo.canonicalUrl });

    let schemaScript = document.getElementById("promet-jsonld");
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.type = "application/ld+json";
      schemaScript.id = "promet-jsonld";
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(seo.structuredData);
  }, [location.pathname]);

  return null;
};

export default SeoManager;
