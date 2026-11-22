import { readFileSync } from "node:fs";
import path from "node:path";

// The page body is the exact markup of landing-preview/new-landing/index.html (minus the clone.js tag,
// which the layout renders at the end of <body>). `display: contents` keeps the wrapper out of layout.
const body = readFileSync(path.join(process.cwd(), "app", "landing-body.html"), "utf8");

export default function Home() {
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: body }} suppressHydrationWarning />;
}
