export const SITE_URL = "https://promet.indevs.in";

const DEFAULT_OG_IMAGE = `${SITE_URL}/android-chrome-512x512.png`;

const ORGANIZATION_SCHEMA = {
  "@type": "Organization",
  "@id": `${SITE_URL}#organization`,
  name: "Promet",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/android-chrome-512x512.png`,
  },
  sameAs: ["https://github.com/Tripadh/Promet"],
  contactPoint: [
    {
      "@type": "ContactPoint",
      email: "support@promet.ai",
      contactType: "customer support",
      availableLanguage: ["English"],
    },
  ],
};

const WEBSITE_SCHEMA = {
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: "Promet",
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const routeSeoMap = {
  "/": {
    title: "Promet | AI Software Development & Digital Solutions",
    description:
      "Promet helps teams turn rough ideas into precise AI prompts for faster software delivery and better digital product outcomes.",
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    ogType: "website",
    breadcrumbs: [{ name: "Home", path: "/" }],
  },
  "/terms": {
    title: "Promet Terms & Policies",
    description: "Read the official Promet terms and policies for secure, responsible use of the platform.",
    robots: "index,follow",
    ogType: "article",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Terms & Policies", path: "/terms" },
    ],
  },
  "/privacy": {
    title: "Promet Privacy Policy",
    description: "Learn how Promet handles account, prompt, and usage data with privacy-first practices.",
    robots: "index,follow",
    ogType: "article",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Privacy Policy", path: "/privacy" },
    ],
  },
  "/acceptable-use": {
    title: "Promet Acceptable Use Policy",
    description:
      "Review Promet acceptable use guidelines to keep prompt generation safe, legal, and reliable for everyone.",
    robots: "index,follow",
    ogType: "article",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Acceptable Use Policy", path: "/acceptable-use" },
    ],
  },
  "/shared": {
    title: "Promet Shared Conversation",
    description: "View a read-only Promet shared conversation and optimized prompt history.",
    robots: "noindex,follow",
    ogType: "article",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Shared Conversation", path: "/shared" },
    ],
  },
  "/login": {
    title: "Promet Login",
    description: "Sign in to Promet to access your AI prompt workspace.",
    robots: "noindex,nofollow",
  },
  "/register": {
    title: "Create Promet Account",
    description: "Create your Promet account and start building better AI prompts.",
    robots: "noindex,nofollow",
  },
  "/forgot-password": {
    title: "Reset Promet Password",
    description: "Reset your Promet password securely and regain access to your account.",
    robots: "noindex,nofollow",
  },
  "/oauth-success": {
    title: "Promet Authentication",
    description: "Completing Promet authentication and redirecting to your workspace.",
    robots: "noindex,nofollow",
  },
  "/dashboard": {
    title: "Promet Dashboard",
    description: "Manage your prompt history and generate improved AI prompts in Promet.",
    robots: "noindex,nofollow",
  },
  "/settings": {
    title: "Promet Settings",
    description: "Manage your Promet account settings and preferences.",
    robots: "noindex,nofollow",
  },
  "/admin": {
    title: "Promet Admin",
    description: "Promet administration portal.",
    robots: "noindex,nofollow",
  },
};

const defaultSeo = {
  title: "Promet | AI Software Development & Digital Solutions",
  description:
    "Promet helps teams turn rough ideas into precise AI prompts for faster software delivery and better digital product outcomes.",
  robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  ogType: "website",
  breadcrumbs: [{ name: "Home", path: "/" }],
};

const getRouteKey = (pathname) => {
  if (pathname.startsWith("/shared/")) return "/shared";
  if (pathname.startsWith("/admin")) return "/admin";
  return pathname;
};

export const getSeoForPath = (pathname) => {
  const routeKey = getRouteKey(pathname);
  const routeSeo = routeSeoMap[routeKey] || defaultSeo;
  const canonicalPath = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
  const canonicalUrl = `${SITE_URL}${canonicalPath || "/"}`;
  const siteName = "Promet";
  const ogImage = DEFAULT_OG_IMAGE;

  const breadcrumbItems = (routeSeo.breadcrumbs || defaultSeo.breadcrumbs).map((item, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: item.name,
    item: `${SITE_URL}${item.path === "/" ? "/" : item.path}`,
  }));

  const webPageSchema = {
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: routeSeo.title,
    description: routeSeo.description,
    isPartOf: { "@id": `${SITE_URL}#website` },
    inLanguage: "en",
  };

  const graph = [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA, webPageSchema];
  if (breadcrumbItems.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    });
  }

  return {
    ...routeSeo,
    canonicalUrl,
    siteName,
    ogImage,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": graph,
    },
  };
};
