// One-time helper: run locally to get GOOGLE_REFRESH_TOKEN.
//   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/getRefreshToken.js
import http from "node:http";
import { google } from "googleapis";

const REDIRECT = "http://localhost:3000/oauth2callback";
const oauth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, REDIRECT);

const url = oauth.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
});
console.log("Open this URL in your browser:\n\n" + url + "\n");

http
  .createServer(async (req, res) => {
    if (!req.url.startsWith("/oauth2callback")) return res.end();
    const code = new URL(req.url, "http://localhost:3000").searchParams.get("code");
    const { tokens } = await oauth.getToken(code);
    res.end("Done. You can close this tab.");
    console.log("\nGOOGLE_REFRESH_TOKEN=" + tokens.refresh_token);
    process.exit(0);
  })
  .listen(3000);
