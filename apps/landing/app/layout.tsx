import type { Viewport } from "next";

// Mirrors <head> of landing-preview/new-landing/index.html tag-for-tag (generated).
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
        <link rel="preload" as="image" imageSrcSet="assets/img/marketing-figma-product-parking-night.jpg 32w, assets/img/marketing-figma-product-parking-night.jpg 48w, assets/img/marketing-figma-product-parking-night.jpg 64w, assets/img/marketing-figma-product-parking-night.jpg 96w, assets/img/marketing-figma-product-parking-night.jpg 128w, assets/img/marketing-figma-product-parking-night.jpg 256w, assets/img/marketing-figma-product-parking-night.jpg 384w, assets/img/marketing-figma-product-parking-night.jpg 640w, assets/img/marketing-figma-product-parking-night.jpg 750w, assets/img/marketing-figma-product-parking-night.jpg 828w, assets/img/marketing-figma-product-parking-night.jpg 1080w, assets/img/marketing-figma-product-parking-night.jpg 1200w, assets/img/marketing-figma-product-parking-night.jpg 1920w, assets/img/marketing-figma-product-parking-night.jpg 2048w, assets/img/marketing-figma-product-parking-night.jpg 3840w" imageSizes="1152px" />
        <link rel="stylesheet" href="assets/2vh4gd9rb19q0.css" />
        <link rel="stylesheet" href="assets/09z_4zirjmsh4.css" />
        <link rel="stylesheet" href="assets/3r7cicuf3xu7i.css" />
        <link rel="stylesheet" href="assets/2xab2v5s2qal4.css" />
        <link rel="preload" href="assets/2-ff2abrggthq.css" as="style" />
        <link rel="expect" href="#_R_" blocking="render" />
        <meta name="theme-color" content="#111827" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)" />
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
        <link rel="shortcut icon" href="favicon-16x16.png" />
        <link rel="icon" href="favicon.ico" />
        <link rel="icon" href="favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
        <link rel="stylesheet" href="clone.css" />
      </head>
      <body className="min-h-full min-w-full flex flex-col" suppressHydrationWarning>
        {children}
        {/* same position as the original: end of <body>, runs after the markup is parsed */}
        <script src="clone.js" />
      </body>
    </html>
  );
}
