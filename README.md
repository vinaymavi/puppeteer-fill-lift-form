# Puppeteer Lift Form Automation

An automated solution for completing lift registration forms on the Uttar Pradesh Directorate of Electrical Safety (UPDES) portal (updeslift.org).

## Configuration

1. Prepare your CSV file with lift registration data (see `lift_data.csv` for format example)
2. Set your login credentials in `src/index.ts`:
   ```typescript
   const username = "your_username";
   const password = "your_password";
   ```

## Usage

1. Build the TypeScript code:
   ```
   npm run build
   ```

2. Run the application:
   ```
   npm start
   ```

For development with hot reloading:
```
npm run dev
```

## Form 2 for Existing Forms

To process Form 2 for existing lift registrations:

1. Switch to the 'fill-previous-forms' branch:
   ```
   git checkout fill-previous-forms
   ```

2. Run the application with:
   ```
   npm run dev
   ```

This will process Form 2 submissions for previously registered lifts with completed Form 1 registrations.

## Features

- **Automated Form Filling**: Completes both parts of the lift registration process
- **CAPTCHA Recognition**: Automatically solves CAPTCHAs using Tesseract OCR
- **Bulk Processing**: Processes multiple lift registrations from a CSV file
- **Error Handling**: Takes screenshots at each step for debugging and verification
- **Registration Tracking**: Saves completed registrations to a CSV file

## Prerequisites

- Node.js (v14 or higher)
- Tesseract OCR engine with English language data
- PDF reader for viewing the building plan
- Chrome/Chromium browser (installed automatically by Puppeteer)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/puppeteer-fill-lift-form.git
   cd puppeteer-fill-lift-form
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Ensure Tesseract language data is available in the project root (eng.traineddata)

## CSV Data Format

The application expects a CSV file named `lift_data.csv` with the following columns:

- **Owner details**: ownerName, ownerEmail, ownerMobile, etc.
- **Agent details**: agentName, agentEmail, agentMobile, etc.
- **Lift details**: premiseType, liftMake, liftModel, liftWeight, liftPersons, etc.
- **File paths**: Paths to required documents (building plans, affidavits, etc.)

See the `LiftFormData` interface in `src/index.ts` for the complete list of fields.

## Output

- **Screenshots**: Saved at each step with timestamps for debugging
- **Registration numbers**: Captured and saved to `lift_registrations.csv`
- **CAPTCHA images**: Saved to `captcha.png` for verification

## Troubleshooting

- If CAPTCHA recognition fails, verify the `eng.traineddata` file is in the project root
- Check screenshot files with error prefixes for debugging information
- Ensure all required PDF documents are accessible at the paths specified in the CSV

## License

MIT License - See LICENSE file for details