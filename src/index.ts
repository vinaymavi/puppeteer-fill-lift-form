import puppeteer, { Browser, Page } from "puppeteer";
import * as tesseract from "tesseract.js";
import fs from "fs";
import csv from "csv-parser";
import path from "path";

const loginUrl = "https://updeslift.org/Account/login";
const username = "7078691466";
const password = "Vish@123";
const selectType = "Public";

// Define types for the form data
interface LiftFormData {
  // Owner details
  ownerName: string;
  ownerLocalHouseNo: string;
  ownerLocalBuildingNo: string;
  ownerLocalLandmark: string;
  ownerLocalLocality: string;
  ownerLocalPincode: string;
  ownerPermanentHouseNo: string;
  ownerPermanentBuilding: string;
  ownerPermanentLandmark: string;
  ownerPermanentLocality: string;
  ownerPermanentPincode: string;
  ownerEmail: string;
  ownerMobile: string;

  // Agent details
  agentName: string;
  agentLocalHouseNo: string;
  agentLocalBuildingNo: string;
  agentLocalLandmark: string;
  agentLocalLocality: string;
  agentLocalPincode: string;
  agentPermanentHouseNo: string;
  agentPermanentBuilding: string;
  agentPermanentLandmark: string;
  agentPermanentLocality: string;
  agentPermanentPincode: string;
  agentEmail: string;
  agentMobile: string;

  // Lift details
  premiseHouseNo: string;
  premiseBuildingNo: string;
  premiseLandmark: string;
  premiseLocality: string;
  premisePincode: string;
  premiseType: string;

  // Make details
  liftMake: string;
  liftModel: string;
  liftWeight: string;
  liftPersons: string;
  manufacturerName: string;

  // Local authorized agency details
  localAgentName: string;
  localAgentContactDetail: string;
  localAgentHouseNo: string;
  localAgentBuilding: string;
  localAgentLandmark: string;
  localAgentLocality: string;
  localAgentPincode: string;

  // Commission dates
  commencementDate: string;
  completionDate: string;

  // File paths for annexures
  approvedBuildingPlanPath?: string;
  drawingDetailsPath?: string;
  affidavitOfManufacturerPath?: string;
  technicalDetailsPath?: string;
  safetyFeaturesPath?: string;
  separateDeclarationsPath?: string;
  manufacturerSignaturePath?: string;
  authSignaturePath?: string;
  ownerSignaturePath?: string;

  // New fields for registration step 2
  inCaseThereIsAnyChangePath?: string;
  selfDeclarationNotarizedAffidavitPath?: string;
  affidavitCommissioningAgencyPath?: string;
  affidavitOfTheManufacturerPath2?: string;
  separateDeclarationsOnnotarizedPath?: string;
  suggestiveUsefulLife?: string;

  // Registration number field
  registrationNumber?: string;

  // Registration form completion status
  registrationFormCompleted: boolean;
}

let browser: Browser;
(async () => {
  console.log("Starting browser");
  browser = await puppeteer.launch({ headless: true });
  const page = await getPage(loginUrl);

  // Try to login up to 5 times
  let isLogin = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    isLogin = await login(page);
    if (isLogin) break;
    console.log(`Login attempt ${attempt} failed, trying again...`);
  }

  if (!isLogin) {
    console.error("Failed to login after multiple attempts");
    await browser.close();
    return;
  }

  // Read data from CSV file
  const formDataList = await readFormDataFromCSV("lift_data.csv");
  console.log(`Loaded ${formDataList.length} forms to process`);

  // Add array to store successful submissions
  const successfulSubmissions: LiftFormData[] = [];

  // Process each form data sequentially
  for (let i = 0; i < formDataList.length; i++) {
    const formData = formDataList[i];
    console.log(`Processing form ${i + 1} of ${formDataList.length}`);

    try {
      await listAllForms(page);
      await takePageScreenshot(page);
      await addLiftPage(page);
      await takePageScreenshot(page);

      await fillOwnerDetails(page, formData);
      await takePageScreenshot(page);

      await fillAuthorizedAgentDetails(page, formData);
      await takePageScreenshot(page);

      await fillLiftDetails(page, formData);
      await takePageScreenshot(page);

      await fillMakeDetails(page, formData);
      await takePageScreenshot(page);

      // Add the new step for annexure details
      const registrationNumber = await fillAnnexureDetails(page, formData);
      if (registrationNumber) {
        formData.registrationNumber = registrationNumber;
        successfulSubmissions.push(formData);
        console.log(`Registration number captured: ${registrationNumber}`);
      }
      await takePageScreenshot(page);
      console.log(`Successfully completed first step for form ${i + 1}`);
      console.log(
        `Start second step for form ${
          i + 1
        } registration number ${registrationNumber}`
      );
      // Submit next forms
      await handleRegistrationForm(page, registrationNumber || "");
      await takePageScreenshot(page);
      await fillRegistrationStep2(page, formData);
      await takePageScreenshot(page);
    } catch (error) {
      console.error(`Error processing form ${i + 1}:`, error);
      // Take a screenshot of the error state
      await takePageScreenshot(page, `error-form-${i + 1}`);
      // Continue with the next form
    }

    // Write output CSV with registrations
    if (successfulSubmissions.length > 0) {
      await writeOutputCSV(successfulSubmissions);
      console.log(
        `Saved ${successfulSubmissions.length} registrations to lift_registrations.csv`
      );
    }
  }

  // Close the browser
  await browser.close();
  console.log("Browser closed");
})();

// Function to read form data from CSV
async function readFormDataFromCSV(
  csvFilePath: string
): Promise<LiftFormData[]> {
  const results: LiftFormData[] = [];
  const fullPath = path.resolve(csvFilePath);

  return new Promise((resolve, reject) => {
    fs.createReadStream(fullPath)
      .pipe(csv())
      .on("data", (data) => {
        // Map CSV columns to form data structure
        const formData: LiftFormData = {
          // Owner details
          ownerName: data.ownerName || "",
          ownerLocalHouseNo: data.ownerLocalHouseNo || "",
          ownerLocalBuildingNo: data.ownerLocalBuildingNo || "",
          ownerLocalLandmark: data.ownerLocalLandmark || "",
          ownerLocalLocality: data.ownerLocalLocality || "",
          ownerLocalPincode: data.ownerLocalPincode || "",
          ownerPermanentHouseNo: data.ownerPermanentHouseNo || "",
          ownerPermanentBuilding: data.ownerPermanentBuilding || "",
          ownerPermanentLandmark: data.ownerPermanentLandmark || "",
          ownerPermanentLocality: data.ownerPermanentLocality || "",
          ownerPermanentPincode: data.ownerPermanentPincode || "",
          ownerEmail: data.ownerEmail || "",
          ownerMobile: data.ownerMobile || "",

          // Agent details
          agentName: data.agentName || "",
          agentLocalHouseNo: data.agentLocalHouseNo || "",
          agentLocalBuildingNo: data.agentLocalBuildingNo || "",
          agentLocalLandmark: data.agentLocalLandmark || "",
          agentLocalLocality: data.agentLocalLocality || "",
          agentLocalPincode: data.agentLocalPincode || "",
          agentPermanentHouseNo: data.agentPermanentHouseNo || "",
          agentPermanentBuilding: data.agentPermanentBuilding || "",
          agentPermanentLandmark: data.agentPermanentLandmark || "",
          agentPermanentLocality: data.agentPermanentLocality || "",
          agentPermanentPincode: data.agentPermanentPincode || "",
          agentEmail: data.agentEmail || "",
          agentMobile: data.agentMobile || "",

          // Lift details
          premiseHouseNo: data.premiseHouseNo || "",
          premiseBuildingNo: data.premiseBuildingNo || "",
          premiseLandmark: data.premiseLandmark || "",
          premiseLocality: data.premiseLocality || "",
          premisePincode: data.premisePincode || "",
          premiseType: data.premiseType || "Housing",

          // Make details
          liftMake: data.liftMake || "",
          liftModel: data.liftModel || "",
          liftWeight: data.liftWeight || "",
          liftPersons: data.liftPersons || "",
          manufacturerName: data.manufacturerName || "",

          // Local authorized agency details
          localAgentName: data.localAgentName || "",
          localAgentContactDetail: data.localAgentContactDetail || "",
          localAgentHouseNo: data.localAgentHouseNo || "",
          localAgentBuilding: data.localAgentBuilding || "",
          localAgentLandmark: data.localAgentLandmark || "",
          localAgentLocality: data.localAgentLocality || "",
          localAgentPincode: data.localAgentPincode || "",

          // Commission dates
          commencementDate: data.commencementDate || "",
          completionDate: data.completionDate || "",

          // File paths
          approvedBuildingPlanPath: data.approvedBuildingPlanPath || "",
          drawingDetailsPath: data.drawingDetailsPath || "",
          affidavitOfManufacturerPath: data.affidavitOfManufacturerPath || "",
          technicalDetailsPath: data.technicalDetailsPath || "",
          safetyFeaturesPath: data.safetyFeaturesPath || "",
          separateDeclarationsPath: data.separateDeclarationsPath || "",
          manufacturerSignaturePath: data.manufacturerSignaturePath || "",
          authSignaturePath: data.authSignaturePath || "",
          ownerSignaturePath: data.ownerSignaturePath || "",

          // New fields for registration step 2
          inCaseThereIsAnyChangePath: data.inCaseThereIsAnyChangePath || "",
          selfDeclarationNotarizedAffidavitPath:
            data.selfDeclarationNotarizedAffidavitPath || "",
          affidavitCommissioningAgencyPath:
            data.affidavitCommissioningAgencyPath || "",
          affidavitOfTheManufacturerPath2:
            data.affidavitOfTheManufacturerPath2 || "",
          separateDeclarationsOnnotarizedPath:
            data.separateDeclarationsOnnotarizedPath || "",
          suggestiveUsefulLife: data.suggestiveUsefulLife || "20",

          // Registration form completion status
          registrationFormCompleted: false,
        };

        results.push(formData);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

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
  // @ts-ignore
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

async function takePageScreenshot(page: Page, prefix: string = "") {
  // Generate a unique filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = prefix
    ? `${prefix}-${timestamp}.png`
    : `screenshot-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot saved as ${filename}`);
}

async function listAllForms(page: Page) {
  await page.goto("https://updeslift.org/Admin/ListAnnexure1");
}

async function addLiftPage(page: Page) {
  await page.goto("https://updeslift.org/User/Annexure_1");
  // Increase timeout to 60 seconds (60000ms)
  await page.waitForSelector("#heading", { timeout: 60000 });
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fillOwnerDetails(page: Page, data: LiftFormData) {
  console.log("Filling owner details...");

  // Owner Name
  const ownerNameInput = await page.$("#Annexure1s_OwnerName");
  if (ownerNameInput) {
    await ownerNameInput.evaluate(
      (el) => ((el as HTMLInputElement).value = "")
    );
    await ownerNameInput.type(data.ownerName);
  } else {
    console.error("Owner name input element not found");
  }

  // Local Address
  await page.type("#Annexure1s_OwnerLocalHouseNo", data.ownerLocalHouseNo);
  await page.type(
    "#Annexure1s_OwnerLocalBuildingNo",
    data.ownerLocalBuildingNo
  );
  await page.type("#Annexure1s_OwnerLocalLandmark", data.ownerLocalLandmark);
  await page.type("#Annexure1s_OwnerLocalLocality", data.ownerLocalLocality);
  await page.type("#Annexure1s_Owner_Local_Pincode", data.ownerLocalPincode);

  // Permanent Address
  await page.type(
    "#Annexure1s_OwnerPermanentHouseNo",
    data.ownerPermanentHouseNo
  );
  await page.type(
    "#Annexure1s_OwnerPermanentBuilding",
    data.ownerPermanentBuilding
  );
  await page.type(
    "#Annexure1s_OwnerPermanentLandmark",
    data.ownerPermanentLandmark
  );
  await page.type(
    "#Annexure1s_OwnerPermanentLocality",
    data.ownerPermanentLocality
  );
  await page.type(
    "#Annexure1s_OwnerPermanentPincode",
    data.ownerPermanentPincode
  );

  // Contact Details
  const emailInput = await page.$("input[name='Annexure1s.OwnerMailId']");
  if (emailInput) {
    await emailInput.evaluate((el) => ((el as HTMLInputElement).value = ""));
    await emailInput.type(data.ownerEmail);
  } else {
    console.error("Email input element not found");
  }
  const ownerMobileInput = await page.$("#Annexure1s_OwnerMob");
  if (ownerMobileInput) {
    await ownerMobileInput.evaluate(
      (el) => ((el as HTMLInputElement).value = "")
    );
    await ownerMobileInput.type(data.ownerMobile);
  } else {
    console.error("Owner mobile input element not found");
  }

  // Click Save & Next
  await page.$eval("#nxt1", (el) => {
    (el as HTMLButtonElement).focus();
  });
  await delay(2000);

  await Promise.all([page.click("#nxt1")]);
  await delay(2000);
  console.log("Owner details filled and saved");
}

async function fillAuthorizedAgentDetails(page: Page, data: LiftFormData) {
  console.log("Filling authorized agent details...");

  // Agent Name
  const agentNameInput = await page.$("#Annexure1s_AgentName");
  if (agentNameInput) {
    await agentNameInput.evaluate(
      (el) => ((el as HTMLInputElement).value = "")
    );
    await agentNameInput.type(data.agentName);
  } else {
    console.error("Agent name input element not found");
  }

  // Local Address
  await page.type("#Annexure1s_AgentLocalHouseNo", data.agentLocalHouseNo);
  await page.type(
    "#Annexure1s_AgentLocalBuildingNo",
    data.agentLocalBuildingNo
  );
  await page.type("#Annexure1s_AgentLocalLandmark", data.agentLocalLandmark);
  await page.type("#Annexure1s_AgentLocalLocality", data.agentLocalLocality);
  await page.type("#Annexure1s_Agent_Local_Pincode", data.agentLocalPincode);

  // Permanent Address
  await page.type(
    "#Annexure1s_AgentPermanentHouseNo",
    data.agentPermanentHouseNo
  );
  await page.type(
    "#Annexure1s_AgentPermanentBuilding",
    data.agentPermanentBuilding
  );
  await page.type(
    "#Annexure1s_AgentPermanentLandmark",
    data.agentPermanentLandmark
  );
  await page.type(
    "#Annexure1s_AgentPermanentLocality",
    data.agentPermanentLocality
  );
  await page.type(
    "#Annexure1s_AgentPermanentPincode",
    data.agentPermanentPincode
  );

  // Contact Details
  const emailInput = await page.$("#Annexure1s_AgentMailId");
  if (emailInput) {
    await emailInput.evaluate((el) => ((el as HTMLInputElement).value = ""));
    await emailInput.type(data.agentEmail);
  } else {
    console.error("Agent email input element not found");
  }
  await page.type("#Annexure1s_AgentMob", data.agentMobile);

  // Click Save & Next
  await page.$eval("#nxt2", (el) => {
    (el as HTMLButtonElement).focus();
  });
  await delay(2000);
  await Promise.all([page.click("#nxt2")]);
  await delay(2000);
  console.log("Authorized agent details filled and saved");
}

async function fillLiftDetails(page: Page, data: LiftFormData) {
  console.log("Filling lift details...");

  // Select "No" for new lift registration
  await page.waitForSelector('input[name="IsnewLift"]');
  await page.click('input[name="IsnewLift"][value="No"]');

  // Fill the address details
  await page.type("#AnnexxIIs_PremiseHouseNo", data.premiseHouseNo);
  await page.type("#AnnexxIIs_PremiseBuildingNo", data.premiseBuildingNo);
  await page.type("#AnnexxIIs_PremiseLandmark", data.premiseLandmark);
  await page.type("#AnnexxIIs_PremiseLocality", data.premiseLocality);
  await page.type("#AnnexxIIs_Premise_Pincode", data.premisePincode);

  // Select "Public" premise and specified society type
  await page.waitForSelector("#AnnexxIIs_IsPublicORPrivatePremise");
  await page.select("#AnnexxIIs_IsPublicORPrivatePremise", "Public");
  await delay(1000);

  await page.waitForSelector("#AnnexxIIs_PremiseType");
  await page.select("#AnnexxIIs_PremiseType", data.premiseType);

  // Select "No" for lift being modified or altered
  await page.click('input[name="IsLiftModifyOrAltered"][value="No"]');
  await delay(500);

  // Select "No" for lift being shifted
  await page.click('input[name="IsLiftShifted"][value="No"]');
  await delay(500);

  // Select "No" for building map approved
  await page.click('input[name="IsBuildingMapApproved"][value="No"]');
  await delay(500);

  // Click Save & Next
  await Promise.all([page.click("#nxt3")]);
  await delay(2000);
  console.log("Lift details filled and saved");
}

async function fillMakeDetails(page: Page, data: LiftFormData) {
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
  await page.type("#AnnexIV_Make", data.liftMake);

  // Fill Serial No
  await page.type("#AnnexIV_Model", data.liftModel);

  // Select Type as Existing
  await page.select("#AnnexIV_Type", "Existing");

  // Fill Weight
  await page.type("#AnnexIV_Weight", data.liftWeight);

  // Fill Number of Person
  await page.type("#AnnexIV_NoOfPerson", data.liftPersons);

  // Fill manufacturer name with autocomplete
  await page.type(
    "#AnnexIV_manufacturerName",
    data.manufacturerName.substring(0, 6)
  );
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
        await page.type("#AnnexIV_manufacturerName", data.manufacturerName);
      }
    }
  } catch (error) {
    console.error("Error with autocomplete:", error);
    // Fallback: type the full name manually
    await page.$eval(
      "#AnnexIV_manufacturerName",
      (el) => ((el as HTMLInputElement).value = "")
    );
    await page.type("#AnnexIV_manufacturerName", data.manufacturerName);
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

  // Copy manufacturer registration to agency registration
  const regNumber = await page.$eval(
    "#AnnexIV_RegNoManufacturer",
    (el) => (el as HTMLInputElement).value
  );
  await page.type("#AnnexIV_RegNoAgency", regNumber);

  // Fill local authorized agency details
  await page.type("#AnnexIV_localAuthorizedagencyName", data.localAgentName);
  await page.type(
    "#AnnexIV_localAuthorizedagencyContactDetail",
    data.localAgentContactDetail
  );

  // Fill local authorized agency address
  await page.type("#AnnexIV_agency_Local_HouseNo", data.localAgentHouseNo);
  await page.type("#AnnexIV_agency_Local_Building", data.localAgentBuilding);
  await page.type("#AnnexIV_agency_Local_Landmark", data.localAgentLandmark);
  await page.type("#AnnexIV_agency_Local_Locality", data.localAgentLocality);
  await page.type("#AnnexIV_agency_Local_Pincode", data.localAgentPincode);

  // Set commission dates
  // Format dates as YYYY-MM-DD if not already in that format
  let startDateFormatted = data.commencementDate;
  let endDateFormatted = data.completionDate;

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
  // Focus on the button to make sure it is clickable
  await page.$eval("#nxt4", (el) => {
    (el as HTMLButtonElement).focus();
  });
  // Wait pin code ajax event to complete
  await delay(2000);

  await Promise.all([page.click("#nxt4")]);
  await delay(2000);
  console.log("Lift make details filled and saved");
}

// Helper function to upload a file and handle the success message
async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
): Promise<boolean> {
  if (!filePath || !fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }

  // Find the file input and upload the file
  const fileInput = await page.$(selector);
  if (!fileInput) {
    console.error(`File input selector not found: ${selector}`);
    return false;
  }

  try {
    // Upload the file
    // @ts-ignore
    await fileInput.uploadFile(filePath);
    await delay(1000); // Wait for upload to start

    // Wait for the success modal to appear
    try {
      await page.waitForSelector(".swal-overlay--show-modal", {
        timeout: 10000,
      });

      // Click the OK button on the success message
      const okButton = await page.$(".swal-button--confirm");
      if (okButton) {
        await okButton.click();
        console.log(`Successfully uploaded file: ${path.basename(filePath)}`);
        await delay(500); // Small delay after confirmation
        return true;
      }
    } catch (error) {
      console.error(
        `Timeout waiting for success message after uploading: ${path.basename(
          filePath
        )}`
      );
      return false;
    }
  } catch (error) {
    console.error(`Error uploading file ${path.basename(filePath)}:`, error);
    return false;
  }

  return false;
}

async function fillAnnexureDetails(
  page: Page,
  data: LiftFormData
): Promise<string | null> {
  console.log("Filling annexure details...");

  // Remove header elements that might interfere with form interaction
  await page.evaluate(() => {
    // Remove the main header
    const header = document.querySelector("header.header");
    if (header) header.remove();

    // Remove the page header
    const pageHeader = document.querySelector("header.page-header");
    if (pageHeader) pageHeader.remove();
  });

  // Upload approved building plan
  if (data.approvedBuildingPlanPath) {
    await uploadFile(
      page,
      "#ApprovedbuildingPlan",
      data.approvedBuildingPlanPath
    );
  }

  // Upload drawing details
  if (data.drawingDetailsPath) {
    await uploadFile(
      page,
      "#DrawingdetailsoftheliftOrEscalator",
      data.drawingDetailsPath
    );
  }

  // Upload affidavit of manufacturer
  if (data.affidavitOfManufacturerPath) {
    await uploadFile(
      page,
      "#AffidavitOfManufacturer",
      data.affidavitOfManufacturerPath
    );
  }

  // Upload technical details
  if (data.technicalDetailsPath) {
    await uploadFile(page, "#TechnicalDetails", data.technicalDetailsPath);
  }

  // Upload safety features
  if (data.safetyFeaturesPath) {
    await uploadFile(page, "#SafetyFeatures", data.safetyFeaturesPath);
  }

  // Upload separate declarations
  if (data.separateDeclarationsPath) {
    await uploadFile(
      page,
      "#SeparateDeclarations",
      data.separateDeclarationsPath
    );
  }

  // Upload manufacturer signature
  if (data.manufacturerSignaturePath) {
    await uploadFile(page, "#ManuSignature", data.manufacturerSignaturePath);
  }

  // Upload authorized signature
  if (data.authSignaturePath) {
    await uploadFile(page, "#AuthSig", data.authSignaturePath);
  }

  // Upload owner signature
  if (data.ownerSignaturePath) {
    await uploadFile(page, "#OSig", data.ownerSignaturePath);
  }

  // Check the disclaimer checkbox
  await page.evaluate(() => {
    const checkbox = document.getElementById("clari") as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = true;
    }
  });

  // Click Save & Finish
  await page.$eval("#nxt5", (el) => {
    (el as HTMLButtonElement).focus();
  });
  await delay(2000); // Wait to ensure all uploads are complete

  // Click the Save & Finish button
  try {
    await Promise.all([page.click("#nxt5")]);
    console.log("Form submitted successfully");

    // Wait for the success page to load
    await delay(5000);

    // Extract registration number from the anchor element
    const registrationNumber = await page.evaluate(() => {
      // Find the anchor element within the success message
      const anchor = document.querySelector(
        "h2.purple-text.text-center#finmsg a"
      );
      if (anchor && anchor.textContent) {
        return anchor.textContent.trim();
      }

      // Try alternate method if the anchor doesn't have text content
      if (anchor && anchor.getAttribute("href")) {
        const href = anchor.getAttribute("href");
        const pkIdMatch = href.match(/PK_Id=(\d+)/);
        if (pkIdMatch && pkIdMatch[1]) {
          return anchor.textContent || `TEMP${pkIdMatch[1]}`;
        }
      }

      return null;
    });

    if (registrationNumber) {
      console.log(
        `Successfully captured registration number: ${registrationNumber}`
      );
      return registrationNumber;
    } else {
      console.log("Registration number not found in success page");
      await takePageScreenshot(page, "success-page-no-reg-number");
    }
  } catch (error) {
    console.error("Error submitting the form:", error);

    // Attempt to click again if navigation didn't happen
    try {
      await page.click("#nxt5");
      await delay(5000); // Wait a bit longer
      console.log("Second attempt to submit the form");
    } catch (retryError) {
      console.error("Failed to submit form on retry:", retryError);
    }
  }

  console.log("Annexure details filled and form submitted");
  return null;
}

// New function to fill the registration form step 2
async function fillRegistrationStep2(
  page: Page,
  data: LiftFormData
): Promise<void> {
  console.log("Filling registration form step 2...");

  // Check all three checkboxes at the top
  await page.evaluate(() => {
    // Check "The lift or escalator commissioned is of the same make and manufacturer..."
    const checkbox1 = document.getElementById(
      "LiftEescalatorCommissionedPath"
    ) as HTMLInputElement;
    if (checkbox1) checkbox1.checked = true;

    // Check "The place of commissioning of the lift or escalator is same..."
    const checkbox2 = document.getElementById(
      "PlaceOfCommissioningPath"
    ) as HTMLInputElement;
    if (checkbox2) checkbox2.checked = true;

    // Check "The commissioning agency is same as declared..."
    const checkbox3 = document.getElementById(
      "CommissioningAgencySamePath"
    ) as HTMLInputElement;
    if (checkbox3) checkbox3.checked = true;
  });

  // Upload "In case there is any change..." file if provided
  if (data.separateDeclarationsPath) {
    await uploadFile(
      page,
      "#InCaseThereIsAnyChange",
      data.separateDeclarationsPath
    );
  }

  // Upload "Self-declaration on notarized affidavit..." file if provided
  if (data.affidavitOfManufacturerPath) {
    await uploadFile(
      page,
      "#SelfDeclarationNotarizedAffidavit",
      data.affidavitOfManufacturerPath
    );
  }

  // Upload "Affidavit of the commissioning agency..." file if provided
  if (data.affidavitOfManufacturerPath) {
    await uploadFile(
      page,
      "#AffidavitCommissioningAgency",
      data.affidavitOfManufacturerPath
    );
  }

  // Upload "Affidavit of the manufacturer..." file if provided
  if (data.affidavitOfManufacturerPath) {
    await uploadFile(
      page,
      "#AffidavitOfTheManufacturer",
      data.affidavitOfManufacturerPath
    );
  }

  // Upload "Separate declarations on notarized affidavit..." file if provided
  if (data.separateDeclarationsPath) {
    await uploadFile(
      page,
      "#SeparateDeclarationsOnnotarized",
      data.separateDeclarationsPath
    );
  }

  // Fill in the "Suggestive useful life" input field (default to 20 years if not specified)
  const suggestiveUsefulLife = data.suggestiveUsefulLife || "20";
  await page.type("#SuggestiveUsefulLife", suggestiveUsefulLife);

  // Select "Yes" for the owner/operator training question
  await page.select("#WhethertheOwnerOperatorOfTheLift", "Yes");

  // Wait for a moment to ensure all inputs are processed
  await delay(2000);

  // Take screenshot before clicking the final button
  await takePageScreenshot(
    page,
    `step2-before-save-${data.registrationNumber}`
  );

  // Click the "Save & Finished" button
  try {
    // Make sure the button is in view
    await page.$eval("#nxt2", (el) => {
      (el as HTMLButtonElement).scrollIntoView();
      (el as HTMLButtonElement).focus();
    });
    await delay(1000);

    // Click the button and wait for navigation
    await Promise.all([page.click("#nxt2")]);

    // Take a screenshot after clicking
    await takePageScreenshot(
      page,
      `registration-complete-${data.registrationNumber}`
    );
    console.log(
      `Successfully completed registration form step 2 for ${data.registrationNumber}`
    );
  } catch (error) {
    console.error("Error submitting registration form step 2:", error);
    throw new Error(`Failed to complete registration form step 2: ${error}`);
  }
}

// Updated handleRegistrationForm function to handle both steps
async function handleRegistrationForm(
  page: Page,
  registrationNumber: string,
  data: LiftFormData = {} as LiftFormData
): Promise<void> {
  console.log(`Opening registration form for ${registrationNumber}`);

  // Click the registration number link
  try {
    // First try to click the direct link
    const regLink = await page.$(`h2.purple-text.text-center#finmsg a`);
    if (regLink) {
      // Goto to link src
      let linkHref = await page.evaluate(
        (el) => el.getAttribute("href"),
        regLink
      );
      if (!linkHref.startsWith("https://updeslift.org/")) {
        linkHref = `https://updeslift.org/${linkHref}`;
      }
      if (linkHref) {
        console.log(`Navigating to registration form: ${linkHref}`);
        await page.goto(linkHref);
        console.log(`Navigated to registration form: ${linkHref}`);
      } else {
        console.error("Registration link not found");
      }
    }
  } catch (error) {
    console.error(`Error clicking registration link: ${error}`);
    throw new Error(`Failed to navigate to registration form: ${error}`);
  }

  // Wait for the form to load
  await page.waitForSelector("#RegNo", { timeout: 10000 });

  // Verify we're on the right form by checking the registration number field
  const displayedRegNumber = await page.$eval(
    "#RegNo",
    (el) => (el as HTMLInputElement).value
  );
  if (displayedRegNumber !== registrationNumber) {
    console.warn(
      `Registration number mismatch: Expected ${registrationNumber}, found ${displayedRegNumber}`
    );
  }

  // Take a screenshot of the form
  await takePageScreenshot(page, `registration-form-${registrationNumber}`);

  // Click the Save & Next button
  try {
    // Make sure the button is in view
    await page.$eval("#nxt1", (el) => {
      (el as HTMLButtonElement).scrollIntoView();
      (el as HTMLButtonElement).focus();
    });
    await delay(500);

    // Click the button and wait for navigation
    await Promise.all([page.click("#nxt1")]);

    await delay(500);

    // Take a screenshot after clicking
    await takePageScreenshot(
      page,
      `registration-form-next-${registrationNumber}`
    );
  } catch (error) {
    console.error(`Error completing registration form: ${error}`);
    throw new Error(`Failed to complete registration form: ${error}`);
  }
}

// Function to write registration data to CSV
async function writeOutputCSV(formDataList: LiftFormData[]): Promise<void> {
  const outputPath = path.resolve("lift_registrations.csv");

  // Create CSV header row
  const headers =
    "registrationNumber,liftMake,liftModel,ownerName,premiseLocality";

  // Create CSV rows for each registration
  const rows = formDataList.map((data) => {
    return `${data.registrationNumber || ""},${data.liftMake || ""},${
      data.liftModel || ""
    },${data.ownerName || ""},${data.premiseLocality || ""}`;
  });

  // Combine headers and rows
  const csvContent = headers + "\n" + rows.join("\n");

  // Write to file
  fs.writeFileSync(outputPath, csvContent);
  console.log(`Registration data written to ${outputPath}`);
}
