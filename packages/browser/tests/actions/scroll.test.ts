import { CONFIG } from "@qawolf/config";
import { scroll } from "../../src/actions";
import { Browser } from "../../src/Browser";

describe("scroll", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await Browser.create();
  });

  afterAll(() => browser.close());

  it("scrolls to a given position", async () => {
    const page = await browser.goto(`${CONFIG.testUrl}large`);

    const initialYPosition = await page.evaluate(() => window.pageYOffset);
    expect(initialYPosition).toBe(0);

    const element = await browser.element({
      action: "scroll",
      index: 0,
      target: { xpath: "/html" }
    });
    await scroll(element, { x: 0, y: 1000 });

    const nextYPosition = await page.evaluate(() => window.pageYOffset);
    expect(nextYPosition).toBe(1000);

    await scroll(element, { x: 0, y: 0 });

    const finalYPosition = await page.evaluate(() => window.pageYOffset);
    expect(finalYPosition).toBe(0);
  });

  it("scrolls in infinite scroll", async () => {
    const page = await browser.goto(`${CONFIG.testUrl}infinite_scroll`);

    const initialYPosition = await page.evaluate(() => window.pageYOffset);
    expect(initialYPosition).toBe(0);

    const element = await browser.element({
      action: "scroll",
      index: 0,
      target: { xpath: "/html" }
    });
    await scroll(element, { x: 0, y: 2000 });

    const nextYPosition = await page.evaluate(() => window.pageYOffset);
    expect(nextYPosition).toBe(2000);
  });

  it("throws error if timeout and not able to scroll", async () => {
    const page = await browser.goto(`${CONFIG.testUrl}infinite_scroll`);

    const initialYPosition = await page.evaluate(() => window.pageYOffset);
    expect(initialYPosition).toBe(0);

    const element = await browser.element({
      action: "scroll",
      index: 0,
      target: { xpath: "/html" }
    });

    const testFn = async () => await scroll(element, { x: 0, y: 2000 }, -1);
    await expect(testFn()).rejects.toThrowError();
  });
});
