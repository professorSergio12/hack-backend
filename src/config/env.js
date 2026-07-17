import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 4000,
  apiKey: process.env.API_KEY || "",

  zoho: {
    clientId: process.env.ZOHO_CLIENT_ID || "",
    clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || "",
    accountsUrl: process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com",
    creatorOwner: process.env.ZOHO_CREATOR_OWNER || "",
    creatorApp: process.env.ZOHO_CREATOR_APP || "",
    creatorReport: process.env.ZOHO_CREATOR_REPORT || "STS_Operation_Report",
    referenceField: process.env.ZOHO_REFERENCE_FIELD || "Reference_Number",
    redirectUri: process.env.ZOHO_REDIRECT_URI || "",
  },
};

export function getCreatorBaseUrl() {
  const region = process.env.ZOHO_API_REGION || "com";
  return `https://www.zohoapis.${region}/creator/v2.1/data`;
}
