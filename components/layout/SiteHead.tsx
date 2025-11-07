// components/layout/SiteHead.tsx
import { getCssText } from "@/stitches.config";
import Head from "next/head";
export function SiteHead() {
  return (
    <Head>
      <script
        id="theme-loader"
        async={true}
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
          `,
        }}
      />

      <style id="stitches" dangerouslySetInnerHTML={{ __html: getCssText() }} />
    </Head>
  );
}
