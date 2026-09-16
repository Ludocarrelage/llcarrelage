/* GA4 page views only. Keep enhanced measurement and user-provided data
   collection disabled in the Google tag settings (WhatsApp URLs contain data). */
(() => {
  "use strict";

  const measurementId = document.currentScript?.dataset.measurementId;
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const publicPaths = new Set([
    "/", "/carrelage-sol-mur/", "/carrelage-terrasse/",
    "/carrelage-salle-de-bain/", "/douche-italienne/", "/faience/",
    "/depose-carrelage/", "/ragreage-sol/"
  ]);

  if (!/^G-[A-Z0-9]+$/.test(measurementId || "") || !canonical) return;
  if (!["llcarrelage.fr", "www.llcarrelage.fr"].includes(location.hostname)) return;
  const page = new URL(canonical);
  if (page.origin !== "https://llcarrelage.fr" || !publicPaths.has(page.pathname)) return;
  if (document.getElementById("ll-ga4-tag")) return;

  // Only fixed public page information: never URL queries, fragments or fields.
  let referrer = "";
  try {
    const previous = new URL(document.referrer);
    if (["https:", "http:"].includes(previous.protocol)) referrer = previous.origin + "/";
  } catch (_) { /* An absent referrer is normal. */ }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
  window.gtag("set", {
    page_location: page.origin + page.pathname,
    page_referrer: referrer,
    page_title: document.title,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  window.gtag("js", new Date());
  window.gtag("config", measurementId);

  const tag = document.createElement("script");
  tag.id = "ll-ga4-tag";
  tag.async = true;
  tag.referrerPolicy = "no-referrer";
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.appendChild(tag);
})();
