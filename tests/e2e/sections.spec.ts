import { test, expect } from "@playwright/test";

test.describe("sections", () => {
  test("landing hero renders", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Jean Darry Paulette" })).toBeVisible();
    await expect(page.getByRole("link", { name: "See My Work" })).toBeVisible();
  });

  test("contact form renders", async ({ page }) => {
    await page.goto("/en/contact");
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Message" })).toBeVisible();
  });

  test("legal page renders", async ({ page }) => {
    await page.goto("/en/terms");
    await expect(page.getByRole("heading", { name: "Terms of Use" })).toBeVisible();
    await expect(page.getByText("Dernière mise à jour")).toBeVisible();
  });
});
