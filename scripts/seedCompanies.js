const fs = require("fs");
const path = require("path");

const API_URL = "http://localhost:3000/api/companies";
const DATA_PATH = path.join(__dirname, "../seed_companies.json");

async function seedCompanies() {
  const companies = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  for (const company of companies) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });
      if (res.ok) {
        console.log(`✅ Added: ${company.companyName}`);
      } else {
        const error = await res.text();
        console.error(
          `❌ Failed: ${company.companyName} - ${res.status} ${error}`
        );
      }
    } catch (err) {
      console.error(`❌ Error: ${company.companyName} -`, err);
    }
  }
}

seedCompanies();
