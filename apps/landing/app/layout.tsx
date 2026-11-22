import type { Viewport } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";

const css =
  readFileSync(path.join(process.cwd(), "app", "critical.css"), "utf8") +
  "\n" +
  readFileSync(path.join(process.cwd(), "public", "clone.css"), "utf8");

// Mirrors <head> of landing-preview/new-landing/index.html, minus render-blocking requests (CSS is inlined).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="WPvz0W_variable h-full w-full antialiased" suppressHydrationWarning>
      <head>
        {/* Critical CSS inlined: unused rules purged from the original stylesheets (same rules, same order) + clone.css */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <link rel="preload" as="font" type="font/woff2" href="assets/css-InterVariable-s.p.0qg9ojghpj0ov.woff2" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0F766E" />
        <meta name="next-size-adjust" content="" />
        <title>InstaDine - QR table ordering for small restaurants</title>
        <meta name="description" content="Put a QR code on every table. Guests scan and order from their phone, your kitchen is notified instantly." />
        <link rel="canonical" href="https://www.evpin.com" />
        <link rel="alternate" type="text/markdown" href="https://www.evpin.com/index.md" />
        <meta property="og:title" content="EVpin - Qualify EV Charging Sites in Minutes" />
        <meta property="og:description" content="All-in-One tool for identifying, assessing, and designing EV charging sites." />
        <meta property="og:url" content="https://www.evpin.com" />
        <meta property="og:site_name" content="EVpin" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content="https://www.evpin.com/og.jpg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="EVpin - Qualify EV Charging Sites in Minutes" />
        <meta name="twitter:description" content="All-in-One tool for identifying, assessing, and designing EV charging sites." />
        <meta name="twitter:image" content="https://www.evpin.com/og.jpg" />
        <link rel="icon" href="favicon.ico" sizes="48x48" />
        <link rel="icon" href="icon.svg" type="image/svg+xml" />
        <link rel="icon" href="favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="site.webmanifest" />
        <link rel="stylesheet" href="section-guest-view.css" />
        <link rel="stylesheet" href="section-how-it-works.css" />
        <link rel="stylesheet" href="section-pricing.css" />
        <link rel="stylesheet" href="section-features.css" />
        <link rel="stylesheet" href="section-secure.css" />
        <link rel="stylesheet" href="section-footer.css" />
      </head>
      <body className="min-h-full min-w-full flex flex-col" suppressHydrationWarning>
        {children}
        {/* same position as the original: end of <body>, runs after the markup is parsed */}
        <script src="clone.js" defer />
        <script src="section-guest-view.js" defer />
        <script src="section-how-it-works.js" defer />
        <script src="section-pricing.js" defer />
        <script src="section-features.js" defer />
        <script src="section-secure.js" defer />
        <script src="section-footer.js" defer />
      </body>
    </html>
  );
}
