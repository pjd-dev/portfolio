import { test, expect, type Page, type TestInfo } from "@playwright/test";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveViewport(page: Page, testInfo: TestInfo) {
  return page.viewportSize() ?? (testInfo.project.use?.viewport as
    | { width: number; height: number }
    | undefined);
}

async function takeNamedScreenshot(
  page: Page,
  testInfo: TestInfo,
  pagePath: string,
) {
  const normalizedPath = pagePath.replace(/^\/+/, "") || "home";
  const viewport = resolveViewport(page, testInfo);
  const size = viewport ? `${viewport.width}x${viewport.height}` : "unknown";
  const engine = slugify(testInfo.project.name || "engine");
  const pageName = slugify(normalizedPath);
  const fileName = `${pageName}-${engine}-${size}.png`;

  await page.screenshot({
    path: testInfo.outputPath("screenshots", fileName),
    fullPage: true,
  });
}

test.describe("sections", () => {
  test("landing hero renders", async ({ page }, testInfo) => {
    const path = "/en";
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Jean Darry Paulette" })).toBeVisible();
    await expect(page.getByRole("link", { name: "See My Work" })).toBeVisible();
    await takeNamedScreenshot(page, testInfo, path);
  });

  test("contact form renders", async ({ page }, testInfo) => {
    const path = "/en/contact";
    await page.goto(path);
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Message" })).toBeVisible();
    await takeNamedScreenshot(page, testInfo, path);
  });

  test("work with me form renders", async ({ page }, testInfo) => {
    const path = "/en/work-with-me";
    await page.goto(path);
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send request" })).toBeVisible();
    await takeNamedScreenshot(page, testInfo, path);
  });

  test("legal page renders", async ({ page }, testInfo) => {
    const path = "/en/terms";
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Terms of Use" })).toBeVisible();
    await expect(page.getByText("Dernière mise à jour")).toBeVisible();
    await takeNamedScreenshot(page, testInfo, path);
  });
});
