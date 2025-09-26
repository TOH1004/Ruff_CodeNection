const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Load credentials
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "keys", "gsheets-key.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Your Google Sheet ID
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID"; 

// Read guardhouse locations
app.get("/guardhouses", async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Guardhouses!A:D", // Example sheet/tab
  });

  res.json(response.data.values);
});

// Add a guardhouse
app.post("/guardhouses", async (req, res) => {
  const { name, latitude, longitude } = req.body;
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Guardhouses!A:D",
    valueInputOption: "RAW",
    requestBody: {
      values: [[name, latitude, longitude, new Date().toISOString()]],
    },
  });

  res.json({ message: "Guardhouse added" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
