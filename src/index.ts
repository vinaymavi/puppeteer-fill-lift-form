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
  await fillMakeDetails(page);
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

async function fillMakeDetails(page: Page) {
  console.log("Filling lift make details...");

  // Remove header elements that might interfere with form interaction
  await page.evaluate(() => {
    // Remove the main header
    const header = document.querySelector("header.header");
    if (header) header.remove();

    // Remove the page header
    const pageHeader = document.querySelector("header.page-header");
    if (pageHeader) pageHeader.remove();
  });

  // Check that "Lift" radio button is selected (should be default)
  const isLiftChecked = await page.$eval(
    'input[name="LiftType"][value="Lift"]',
    (el) => (el as HTMLInputElement).checked
  );
  if (!isLiftChecked) {
    await page.click('input[name="LiftType"][value="Lift"]');
  }

  // Fill Make/Model
  await page.type("#AnnexIV_Make", "TKE Evolution 200");

  // Fill Serial No
  await page.type("#AnnexIV_Model", "TKE2023456789");

  // Select Type as Existing
  await page.select("#AnnexIV_Type", "Existing");

  // Fill Weight
  await page.type("#AnnexIV_Weight", "680");

  // Fill Number of Person
  await page.type("#AnnexIV_NoOfPerson", "10");

  // Fill manufacturer name with autocomplete
  await page.type("#AnnexIV_manufacturerName", "TK");
  await delay(2000); // Wait for autocomplete to appear

  // Select the first autocomplete option
  try {
    const autocompleteOptions = await page.$("#ui-id-1");
    if (autocompleteOptions) {
      const firstOption = await page.$("#ui-id-1 li:first-child");
      if (firstOption) {
        await firstOption.click();
        await delay(3000); // Wait for auto-fill to complete
      } else {
        console.log("No autocomplete options found, typing full name manually");
        await page.$eval(
          "#AnnexIV_manufacturerName",
          (el) => ((el as HTMLInputElement).value = "")
        );
        await page.type(
          "#AnnexIV_manufacturerName",
          "TK Elevator India private Limited"
        );
      }
    }
  } catch (error) {
    console.error("Error with autocomplete:", error);
    // Fallback: type the full name manually
    await page.$eval(
      "#AnnexIV_manufacturerName",
      (el) => ((el as HTMLInputElement).value = "")
    );
    await page.type(
      "#AnnexIV_manufacturerName",
      "TK Elevator India private Limited"
    );
  }

  // Wait for auto-fill of manufacturer address and registration
  await delay(3000);

  // If local representative details are not auto-filled, manually fill them
  const localAuthName = await page.$eval(
    "#AnnexIV_localAuthorizedManufacturerName",
    (el) => (el as HTMLInputElement).value
  );

  if (!localAuthName || localAuthName.trim() === "") {
    console.log(
      "Local representative details not auto-filled, filling manually"
    );

    // Fill local authorized representative name
    await page.type(
      "#AnnexIV_localAuthorizedManufacturerName",
      "TK Elevator Representative"
    );

    // Fill contact number
    await page.type(
      "#AnnexIV_localAuthorizedManufactureContactDetail",
      "9876543210"
    );

    // Fill address details
    await page.type("#AnnexIV_manufacturer_Local_HouseNo", "101");
    await page.type(
      "#AnnexIV_manufacturer_Local_Building",
      "TK Service Center"
    );
    await page.type(
      "#AnnexIV_manufacturer_Local_Landmark",
      "Near Industrial Area"
    );
    await page.type("#AnnexIV_manufacturer_Local_Locality", "Sector 63");
    await page.type("#AnnexIV_manufacturer_Local_Pincode", "201301");
    await delay(2000); // Wait for pincode-based fields to auto-populate
  }

  // Fill commissioning agency name (same as manufacturer)
  const manufacturerName = await page.$eval(
    "#AnnexIV_manufacturerName",
    (el) => (el as HTMLInputElement).value
  );
  await page.type("#AnnexIV_agencyfacturerName", manufacturerName);

  // Manually copy manufacturer address fields to agency fields
  // House No
  const houseNo = await page.$eval(
    "#AnnexIV_manufacturar_HouseNo",
    (el) => (el as HTMLInputElement).value
  );
  await page.type("#AnnexIV_agency_HouseNo", houseNo);

  // Building
  const building = await page.$eval(
    "#AnnexIV_manufacturar_Building",
    (el) => (el as HTMLInputElement).value
  );
  await page.type("#AnnexIV_agency_Building", building);

  // Landmark
  const landmark = await page.$eval(
    "#AnnexIV_manufacturar_Landmark",
    (el) => (el as HTMLInputElement).value
  );
  await page.type("#AnnexIV_agency_Landmark", landmark);

  // Locality
  const locality = await page.$eval(
    "#AnnexIV_manufracturar_Locality",
    (el) => (el as HTMLInputElement).value
  );
  await page.type("#AnnexIV_agency_Locality", locality);

  // Pincode - this will auto-populate state, district, tehsil
  const pincode = await page.$eval(
    "#AnnexIV_manufacturer_Pincode",
    (el) => (el as HTMLInputElement).value
  );
  await page.type("#AnnexIV_agency_Pincode", pincode);
  await delay(2000); // Wait for pincode-based fields to auto-populate

  // Copy manufacturer registration to agency registration
  const regNumber = await page.$eval(
    "#AnnexIV_RegNoManufacturer",
    (el) => (el as HTMLInputElement).value
  );
  await page.type("#AnnexIV_RegNoAgency", regNumber);

  // Fill local authorized agency details
  await page.type(
    "#AnnexIV_localAuthorizedagencyName",
    "TK Elevator Local Agent"
  );
  await page.type("#AnnexIV_localAuthorizedagencyContactDetail", "9898989898");

  // Fill local authorized agency address
  await page.type("#AnnexIV_agency_Local_HouseNo", "102");
  await page.type("#AnnexIV_agency_Local_Building", "TK Local Office");
  await page.type("#AnnexIV_agency_Local_Landmark", "Near Main Market");
  await page.type("#AnnexIV_agency_Local_Locality", "Sector 58");
  await page.type("#AnnexIV_agency_Local_Pincode", "250001");

  // Set proposed dates
  // Get current date
  const currentDate = new Date();
  // Set commissioning start date to current date
  const startDate = new Date(currentDate);
  // Set completion date to 1 month after start date
  const endDate = new Date(currentDate);
  endDate.setMonth(endDate.getMonth() + 1);

  // Format dates as YYYY-MM-DD
  const startDateFormatted = startDate.toISOString().split("T")[0];
  const endDateFormatted = endDate.toISOString().split("T")[0];

  await page.$eval(
    "#AnnexIV_Commencement_commissioning_Date",
    (el, date) => ((el as HTMLInputElement).value = date),
    startDateFormatted
  );
  await page.$eval(
    "#AnnexIV_Completion_commissioning_Date",
    (el, date) => ((el as HTMLInputElement).value = date),
    endDateFormatted
  );

  // Click Save & Next
  // Foucs on the button to make sure it is clickable
  await page.$eval("#nxt4", (el) => {
    (el as HTMLButtonElement).focus();
  });
  // Wait pin code ajax event to complete
  await delay(2000);
  // Read the value of the input element
  const divisionValue = await page.$eval(
    "#AnnexIV_agency_Local_Divison",
    (el) => {
      // print this HTML element
      console.log("Element:", el);
      // print this HTML element value
      console.log("Element value:", (el as HTMLInputElement).value);
      return (el as HTMLInputElement).value;
    }
  );

  console.log("Division value:", divisionValue);
  await Promise.all([page.click("#nxt4")]);
  await delay(2000);
  console.log("Lift make details filled and saved");
}
