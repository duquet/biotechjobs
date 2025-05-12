import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

console.log("DATABASE_URL:", process.env.DATABASE_URL);

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const systemPrompt = `You are a biotech industry expert. Provide detailed information about biotech companies in the Western United States. For each company, provide:
1. Company name
2. Website URL
3. Location (city, state)
4. Company description
5. Products/technologies
6. Company size
7. Industry focus
8. Founded year
9. Headquarters
10. Contact information
11. Job opportunities

Format the response as a JSON array of companies.`;

const userPrompt = `Please provide information about 5 major biotech companies in the Western United States, including Boston Scientific. Focus on companies that:
- Are actively hiring
- Have strong R&D programs
- Are well-established
- Have innovative technologies
- Are known for good workplace culture

Include specific details about their products, technologies, and job opportunities.`;

async function fetchCompanyData() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error("No response from OpenAI");

    console.log("Raw OpenAI response:", response);
    let companies;
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed.companies)) {
        companies = parsed.companies;
      } else if (parsed.companies && typeof parsed.companies === "object") {
        // If companies is a single object, wrap it in an array
        companies = [parsed.companies];
      } else if (parsed.company_name) {
        // If the response is a single company object at the root
        companies = [parsed];
      } else {
        throw new Error(
          "Response does not contain companies array or company object"
        );
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      throw parseError;
    }
    if (!Array.isArray(companies)) {
      throw new Error(
        "Parsed companies is not an array. Parsed value: " +
          JSON.stringify(companies)
      );
    }
    return companies;
  } catch (error) {
    console.error("Error fetching company data:", error);
    throw error;
  }
}

async function insertCompanies(companies: any[]) {
  // Import db and biotechCompanies here
  const { db } = await import("../src/db");
  const { biotechCompanies } = await import("../src/db/schema");
  try {
    for (const company of companies) {
      const companyData = {
        companyName: company.company_name,
        website: company.website_url,
        city: company.location?.split(",")[0]?.trim(),
        state: company.location?.split(",")[1]?.trim(),
        companyDescription: company.company_description,
        companyProducts: company.products_technologies,
        companySize: company.company_size,
        industry: company.industry_focus,
        foundedYear: company.founded_year,
        headquarters: company.headquarters,
        contactEmail: company.contact_information?.email,
        contactPhone: company.contact_information?.phone_number,
        notes: company.job_opportunities,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(biotechCompanies).values(companyData);
      console.log(`Inserted company: ${company.company_name}`);
    }
  } catch (error) {
    console.error("Error inserting companies:", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("Fetching company data...");
    const companies = await fetchCompanyData();
    console.log(`Fetched ${companies.length} companies`);

    console.log("Inserting companies into database...");
    await insertCompanies(companies);
    console.log("Successfully populated database with companies");
  } catch (error) {
    console.error("Error in main:", error);
    process.exit(1);
  }
}

main();
