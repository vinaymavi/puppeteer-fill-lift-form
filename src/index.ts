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
  await fillOwnerDetails(page);
  await takePageScreenshot(page);
  await fillAuthorizedAgentDetails(page);
  await takePageScreenshot(page);
  await fillLiftDetails(page);
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

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fillOwnerDetails(page: Page) {
  // Owner Name
  await page.type("#Annexure1s_OwnerName", "Bindal Arcade  Pvt Ltd");

  // Local Address
  await page.type("#Annexure1s_OwnerLocalHouseNo", "123");
  await page.type("#Annexure1s_OwnerLocalBuildingNo", "Tower A");
  await page.type("#Annexure1s_OwnerLocalLandmark", "Near Metro Station");
  await page.type("#Annexure1s_OwnerLocalLocality", "Sector 62");
  await page.type("#Annexure1s_Owner_Local_Pincode", "201301");

  // Wait for pincode-based fields to auto-populate
  await delay(2000);

  // Permanent Address (fill manually)
  await page.type("#Annexure1s_OwnerPermanentHouseNo", "123");
  await page.type("#Annexure1s_OwnerPermanentBuilding", "Tower A");
  await page.type("#Annexure1s_OwnerPermanentLandmark", "Near Metro Station");
  await page.type("#Annexure1s_OwnerPermanentLocality", "Sector 62");
  await page.type("#Annexure1s_OwnerPermanentPincode", "201301");

  // Wait for permanent address pincode-based fields to auto-populate
  await delay(2000);

  // Contact Details
  const emailInput = await page.$("input[name='Annexure1s.OwnerMailId']");
  if (emailInput) {
    await emailInput.evaluate((el) => ((el as HTMLInputElement).value = ""));
    await emailInput.type("bindalarcadepvtltd@gmail.com");
  } else {
    console.error("Email input element not found");
  }
  await page.type("#Annexure1s_OwnerMob", "8802759959");

  // Click Save & Next
  await Promise.all([page.click("#nxt1")]);
  await delay(2000);
}

async function fillAuthorizedAgentDetails(page: Page) {
  console.log("Filling authorized agent details...");

  // Agent Name
  const agentNameInput = await page.$("#Annexure1s_AgentName");
  if (agentNameInput) {
    await agentNameInput.evaluate(
      (el) => ((el as HTMLInputElement).value = "")
    );
    await agentNameInput.type("John Doe");
  } else {
    console.error("Agent name input element not found");
  }
  // Local Address
  await page.type("#Annexure1s_AgentLocalHouseNo", "456");
  await page.type("#Annexure1s_AgentLocalBuildingNo", "Green Tower");
  await page.type("#Annexure1s_AgentLocalLandmark", "Near City Mall");
  await page.type("#Annexure1s_AgentLocalLocality", "Sector 50");
  await page.type("#Annexure1s_Agent_Local_Pincode", "201301");

  // Wait for pincode-based fields to auto-populate
  await delay(2000);

  // Permanent Address (fill manually)
  await page.type("#Annexure1s_AgentPermanentHouseNo", "456");
  await page.type("#Annexure1s_AgentPermanentBuilding", "Green Tower");
  await page.type("#Annexure1s_AgentPermanentLandmark", "Near City Mall");
  await page.type("#Annexure1s_AgentPermanentLocality", "Sector 50");
  await page.type("#Annexure1s_AgentPermanentPincode", "201301");

  // Wait for permanent address pincode-based fields to auto-populate
  await delay(2000);

  // Contact Details
  const emailInput = await page.$("#Annexure1s_AgentMailId");
  if (emailInput) {
    await emailInput.evaluate((el) => ((el as HTMLInputElement).value = ""));
    await emailInput.type("agent.bindal@gmail.com");
  } else {
    console.error("Agent email input element not found");
  }
  await page.type("#Annexure1s_AgentMob", "9876543210");

  // Click Save & Next
  await Promise.all([page.click("#nxt2")]);
  await delay(2000);
  console.log("Authorized agent details filled and saved");
}

async function fillLiftDetails(page: Page) {
  console.log("Filling lift details...");

  // Select "No" for new lift registration
  await page.waitForSelector('input[name="IsnewLift"]');
  await page.click('input[name="IsnewLift"][value="No"]');
  await delay(1000);

  // Fill the address details
  await page.type("#AnnexxIIs_PremiseHouseNo", "234");
  await page.type("#AnnexxIIs_PremiseBuildingNo", "Bindal Arcade");
  await page.type("#AnnexxIIs_PremiseLandmark", "Near Sector 62 Metro Station");
  await page.type("#AnnexxIIs_PremiseLocality", "Sector 62");
  await page.type("#AnnexxIIs_Premise_Pincode", "201301");

  // Wait for pincode-based fields to auto-populate
  await delay(2000);

  // Select "Public" premise and "Housing" society
  await page.waitForSelector("#AnnexxIIs_IsPublicORPrivatePremise");
  await page.select("#AnnexxIIs_IsPublicORPrivatePremise", "Public");
  await delay(1000);

  await page.waitForSelector("#AnnexxIIs_PremiseType");
  await page.select("#AnnexxIIs_PremiseType", "Housing");

  // Select "No" for lift being modified or altered
  await page.click('input[name="IsLiftModifyOrAltered"][value="No"]');
  await delay(1000);

  // Select "No" for lift being shifted
  await page.click('input[name="IsLiftShifted"][value="No"]');
  await delay(1000);

  // Select "No" for building map approved
  await page.click('input[name="IsBuildingMapApproved"][value="No"]');
  await delay(1000);

  // Click Save & Next
  await Promise.all([page.click("#nxt3")]);
  await delay(2000);
  console.log("Lift details filled and saved");
}
