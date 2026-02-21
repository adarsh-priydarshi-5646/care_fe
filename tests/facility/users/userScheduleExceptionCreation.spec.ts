import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

class ScheduleExceptionFormPage {
  constructor(private readonly page: Page) {}

  async fillReason(reason: string): Promise<void> {
    await this.page.getByLabel("Reason").fill(reason);
  }

  async selectFutureDate(label: string, monthsAhead: number): Promise<void> {
    const formItem = this.page
      .locator("label", { hasText: label })
      .locator("..");
    const pickerButton = formItem.locator(
      'button[data-slot="popover-trigger"]',
    );
    await pickerButton.click();

    const nextMonthBtn = this.page.getByRole("button", {
      name: "Go to the Next Month",
    });
    await expect(nextMonthBtn).toBeVisible();

    for (let i = 0; i < monthsAhead; i++) {
      await nextMonthBtn.click({ force: true });
    }

    await this.page
      .getByRole("gridcell")
      .filter({ hasText: /^15$/ })
      .getByRole("button")
      .click();
  }

  async fillStartTime(time: string): Promise<void> {
    await this.page.getByLabel("From").fill(time);
  }

  async fillEndTime(time: string): Promise<void> {
    await this.page.getByLabel("To").fill(time);
  }

  async toggleFullDayUnavailable(): Promise<void> {
    await this.page.getByLabel("Full Day Unavailable").click();
  }

  async submit(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Confirm Unavailability" })
      .click();
  }
}

test.describe("Schedule Exception Creation", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/users/admin`);
    await page.getByRole("link", { name: "Availability" }).click();
  });

  test("should create a schedule exception with time range", async ({
    page,
  }) => {
    const reason = faker.lorem.words(3);
    const formPage = new ScheduleExceptionFormPage(page);

    await test.step("Open the add exception form", async () => {
      await expect(
        page.getByRole("button", { name: "Add Exception" }),
      ).toBeVisible({ timeout: 10000 });
      await page.getByRole("button", { name: "Add Exception" }).click();
      await expect(
        page.getByRole("heading", { name: "Add Schedule Exceptions" }),
      ).toBeVisible();
    });

    await test.step("Fill exception form with time range", async () => {
      await formPage.fillReason(reason);
      await formPage.selectFutureDate("Valid From", 1);
      await formPage.selectFutureDate("Valid To", 1);
      await formPage.fillStartTime("09:00");
      await formPage.fillEndTime("17:00");
    });

    await test.step("Submit and verify success", async () => {
      await formPage.submit();
      await expect(
        page
          .getByRole("region", { name: "Notifications alt+T" })
          .getByRole("listitem")
          .filter({ hasText: "Exception created" }),
      ).toBeVisible();
    });

    await test.step("Verify exception appears in the list", async () => {
      const exceptionCard = page
        .locator("div.rounded-lg.bg-white")
        .filter({ hasText: reason });
      await expect(exceptionCard).toBeVisible();
      await expect(exceptionCard).toContainText(reason);
      await expect(exceptionCard).toContainText("9 AM");
      await expect(exceptionCard).toContainText("5 PM");
    });
  });

  test("should create a full-day schedule exception", async ({ page }) => {
    const reason = faker.lorem.words(3);
    const formPage = new ScheduleExceptionFormPage(page);

    await test.step("Open the add exception form", async () => {
      await expect(
        page.getByRole("button", { name: "Add Exception" }),
      ).toBeVisible({ timeout: 10000 });
      await page.getByRole("button", { name: "Add Exception" }).click();
      await expect(
        page.getByRole("heading", { name: "Add Schedule Exceptions" }),
      ).toBeVisible();
    });

    await test.step("Fill exception form with full-day option", async () => {
      await formPage.fillReason(reason);
      await formPage.selectFutureDate("Valid From", 2);
      await formPage.selectFutureDate("Valid To", 2);
      await formPage.toggleFullDayUnavailable();
    });

    await test.step("Verify time fields are disabled", async () => {
      await expect(page.getByLabel("From")).toBeDisabled();
      await expect(page.getByLabel("To")).toBeDisabled();
    });

    await test.step("Submit and verify success", async () => {
      await formPage.submit();
      await expect(
        page
          .getByRole("region", { name: "Notifications alt+T" })
          .getByRole("listitem")
          .filter({ hasText: "Exception created" }),
      ).toBeVisible();
    });

    await test.step("Verify exception appears in the list", async () => {
      const exceptionCard = page
        .locator("div.rounded-lg.bg-white")
        .filter({ hasText: reason });
      await expect(exceptionCard).toBeVisible();
      await expect(exceptionCard).toContainText(reason);
    });
  });

  test("should show validation errors when submitting empty form", async ({
    page,
  }) => {
    await test.step("Open the add exception form", async () => {
      await expect(
        page.getByRole("button", { name: "Add Exception" }),
      ).toBeVisible({ timeout: 10000 });
      await page.getByRole("button", { name: "Add Exception" }).click();
      await expect(
        page.getByRole("heading", { name: "Add Schedule Exceptions" }),
      ).toBeVisible();
    });

    await test.step("Submit without filling any fields", async () => {
      await page
        .getByRole("button", { name: "Confirm Unavailability" })
        .click();
    });

    await test.step("Verify validation errors are shown", async () => {
      const formMessages = page.locator('[data-slot="form-message"]');
      await expect(formMessages.first()).toBeVisible();
    });
  });
});
