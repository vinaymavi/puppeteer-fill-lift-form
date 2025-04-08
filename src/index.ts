import puppeteer, { Browser, Page } from "puppeteer";
import * as tesseract from "tesseract.js";
import fs from "fs";

const loginUrl = "https://updeslift.org/Account/login";
const username = "8802759959";
const password = "Bindal@123";
const selectType = "Public";

let browser: Browser;
(async () => {
  console.log("Starting browser");
  browser = await puppeteer.launch({ headless: true });
  const page = await getPage(loginUrl);
  let isLogin = await login(page);
  if (!isLogin) {
    isLogin = await login(page);
  }
  if (!isLogin) {
    isLogin = await login(page);
  }
  if (!isLogin) {
    isLogin = await login(page);
  }
  if (!isLogin) {
    isLogin = await login(page);
  }
  await takePageScreenshot(page);
  await listAllForms(page);
  await takePageScreenshot(page);
  await addLiftPage(page);
  await takePageScreenshot(page);
  // Close the browser
  await browser.close();
  console.log("Browser closed");
})();

async function login(page: Page): Promise<boolean> {
  // Fill value in select element
  const selectElement = await page.$("#Type");
  if (selectElement) {
    await selectElement.select(selectType);
  } else {
    console.log("Select element not found");
    throw new Error("Select element not found");
  }

  // Clear and fill username
  await page.$eval("#Mob", (el) => ((el as HTMLInputElement).value = ""));
  await page.type("#Mob", username);

  // Clear and fill password
  await page.$eval("#Password", (el) => ((el as HTMLInputElement).value = ""));
  await page.type("#Password", password);

  const captchaText = await readCaptcha(page);
  // Clear and fill captcha
  await page.$eval("#Captcha", (el) => ((el as HTMLInputElement).value = ""));
  await page.type("#Captcha", captchaText);

  try {
    // Click the button and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click("button.btn.btn-primary.btn-lg"),
    ]);
  } catch (error) {
    console.error("Navigation failed:", error);
    throw error;
  }

  // Check for the error message element
  const errorMessageElement = await page.$("span.text-danger.text-center");
  if (errorMessageElement) {
    const errorMessage = await page.evaluate(
      (el) => el.textContent?.trim(),
      errorMessageElement
    );
    if (errorMessage === "Invalid Captcha") {
      console.error("Login failed: Invalid Captcha");
      return false;
    }
  } else {
    console.log("No error message found, login successful");
    return true;
  }
}

async function getPage(url: string) {
  const page = await browser.newPage();
  await page.goto(url);
  // wait for the page to load
  await page.waitForSelector("#welcome");
  await page.setViewport({ width: 2400, height: 1600 });
  return page;
}

async function readCaptcha(page: Page) {
  const captchaElement = await page.$("img[src='/Account/GetCaptchaimage']");

  if (!captchaElement) {
    console.log("Captcha element not found");
    throw new Error("Captcha element not found");
  }

  const captchaImage = await captchaElement.screenshot({
    encoding: "binary",
  });

  // Convert Uint8Array to Buffer
  const buffer = Buffer.from(captchaImage);

  // Save this buffer to a file if needed
  fs.writeFileSync("captcha.png", buffer);
  // Use tesseract.js to recognize the text in the image
  console.log("Recognizing captcha text...");
  const data = await tesseract.recognize(buffer, "eng");
  const {
    data: { text },
  } = data;
  console.log("Captcha text:", text);
  return text.trim();
}

async function takePageScreenshot(page: Page) {
  // Generate a unique filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `screenshot-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot saved as ${filename}`);
}

async function listAllForms(page: Page) {
  await page.goto("https://updeslift.org/Admin/ListAnnexure1");
}

async function addLiftPage(page: Page) {
  await page.goto("https://updeslift.org/User/Annexure_1");
  await page.waitForSelector("#heading");
}
