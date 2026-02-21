import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Code Management", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/billing/discount_codes`);
    await expect(
      page.getByRole("heading", { name: "Discount Codes" }),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display the discount codes page with table", async ({
    page,
  }) => {
    await test.step("Verify page heading and structure", async () => {
      await expect(
        page.getByRole("heading", { name: "Discount Codes" }),
      ).toBeVisible();
    });

    await test.step("Verify create button is visible", async () => {
      await expect(
        page.getByRole("button", { name: "Create Discount Code" }),
      ).toBeVisible();
    });

    await test.step("Verify search input is visible", async () => {
      await expect(page.getByPlaceholder("Search")).toBeVisible();
    });

    await test.step("Verify table headers are present", async () => {
      await expect(
        page.getByRole("columnheader", { name: "Name" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Code" }),
      ).toBeVisible();
    });
  });

  test("should create a new discount code", async ({ page }) => {
    const codeName = faker.commerce.productName();
    const codeValue = faker.string.alphanumeric(8).toUpperCase();

    await test.step("Open create discount code sheet", async () => {
      await page.getByRole("button", { name: "Create Discount Code" }).click();
      await expect(
        page.getByRole("heading", { name: "Create Discount Code" }),
      ).toBeVisible();
    });

    await test.step("Fill discount code form", async () => {
      await page.getByLabel("Name").fill(codeName);
      await page.getByLabel("Code").fill(codeValue);
    });

    await test.step("Submit and verify success", async () => {
      await page.getByRole("button", { name: "Save" }).click();
      await expect(
        page
          .getByRole("region", { name: "Notifications alt+T" })
          .getByRole("listitem")
          .filter({ hasText: /discount code created/i }),
      ).toBeVisible();
    });

    await test.step("Verify discount code appears in table", async () => {
      await page.getByPlaceholder("Search").fill(codeName);
      const tableBody = page.locator("tbody");
      await expect(tableBody).toContainText(codeName);
      await expect(tableBody).toContainText(codeValue);
    });
  });

  test("should show validation errors when submitting empty discount code form", async ({
    page,
  }) => {
    await test.step("Open create discount code sheet", async () => {
      await page.getByRole("button", { name: "Create Discount Code" }).click();
      await expect(
        page.getByRole("heading", { name: "Create Discount Code" }),
      ).toBeVisible();
    });

    await test.step("Verify save button is disabled when form is empty", async () => {
      const saveButton = page.getByRole("button", { name: "Save" });
      await expect(saveButton).toBeDisabled();
    });
  });

  test("should filter discount codes by search", async ({ page }) => {
    const nonExistentCode = "NonExistentDiscountCode12345";

    await test.step("Search for non-existent discount code", async () => {
      await page.getByPlaceholder("Search").fill(nonExistentCode);
    });

    await test.step("Verify no results message", async () => {
      await expect(page.getByText(/no.*discount.*code/i)).toBeVisible();
    });
  });

  test("should navigate between billing settings tabs", async ({ page }) => {
    await test.step("Navigate to discount components", async () => {
      await page.getByRole("link", { name: "Discount Components" }).click();
      await expect(
        page.getByRole("heading", { name: "Discount Components" }),
      ).toBeVisible();
    });

    await test.step("Navigate to tax codes", async () => {
      await page.getByRole("link", { name: "Tax Codes" }).click();
      await expect(
        page.getByRole("heading", { name: "Tax Codes" }),
      ).toBeVisible();
    });

    await test.step("Navigate to tax components", async () => {
      await page.getByRole("link", { name: "Tax Components" }).click();
      await expect(
        page.getByRole("heading", { name: "Tax Components" }),
      ).toBeVisible();
    });

    await test.step("Navigate back to discount codes", async () => {
      await page.getByRole("link", { name: "Discount Codes" }).click();
      await expect(
        page.getByRole("heading", { name: "Discount Codes" }),
      ).toBeVisible();
    });
  });
});
