import type { Viewport } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";

// Landing sections (injected by the section-*.js scripts), in page order.
const SECTIONS = ["guest-view", "how-it-works", "pricing", "features", "secure", "faq", "footer"];

// All CSS is inlined: purged base styles + clone.css + the section styles, so first paint needs no CSS requests.
const read = (...p: string[]) => readFileSync(path.join(process.cwd(), ...p), "utf8");
const css = [
  read("app", "critical.css"),
  read("public", "clone.css"),
  ...SECTIONS.map((s) => read("public", `section-${s}.css`)),
].join("\n");

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
        {/* Critical CSS inlined: purged base styles + clone.css + section styles (see `css` above) */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <link rel="preload" as="font" type="font/woff2" href="assets/css-InterVariable-s.p.0qg9ojghpj0ov.woff2" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0F766E" />
        <title>InstaDine - QR table ordering for small restaurants</title>
        <meta name="description" content="Put a QR code on every table. Guests scan and order from their phone, your kitchen is notified instantly." />
        <meta property="og:title" content="InstaDine - QR table ordering for small restaurants" />
        <meta property="og:description" content="Put a QR code on every table. Guests scan and order from their phone, your kitchen is notified instantly." />
        <meta property="og:site_name" content="InstaDine" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="InstaDine - QR table ordering for small restaurants" />
        <meta name="twitter:description" content="Put a QR code on every table. Guests scan and order from their phone, your kitchen is notified instantly." />
        <link rel="icon" href="favicon.ico" sizes="48x48" />
        <link rel="icon" href="icon.svg" type="image/svg+xml" />
        <link rel="icon" href="favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="site.webmanifest" />
      </head>
      <body className="min-h-full min-w-full flex flex-col" suppressHydrationWarning>
        {children}
        {/* same position as the original: end of <body>, runs after the markup is parsed */}
        <script src="clone.js" defer />
        {SECTIONS.map((s) => <script key={s} src={`section-${s}.js`} defer />)}
      </body>
    </html>
  );
}
