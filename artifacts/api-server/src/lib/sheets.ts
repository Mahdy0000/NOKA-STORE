import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SHEET_ID = process.env["GOOGLE_SHEET_ID"];
const _dir = dirname(fileURLToPath(import.meta.url));
const localCredsPath = join(_dir, "..", "..", "service-account.json");
const CREDS_JSON = process.env["GOOGLE_CREDENTIALS"] || (existsSync(localCredsPath) ? readFileSync(localCredsPath, "utf-8") : null);

interface OrderRow {
  "Order ID": number;
  Date: string;
  Status: string;
  "Customer Name": string;
  Phone: string;
  Email: string;
  Address: string;
  City: string;
  Governorate: string;
  Items: string;
  "Total (EGP)": number;
}

const HEADERS: (keyof OrderRow)[] = [
  "Order ID", "Date", "Status", "Customer Name", "Phone", "Email",
  "Address", "City", "Governorate", "Items", "Total (EGP)",
];

async function getAccessToken(): Promise<string> {
  const creds = CREDS_JSON ? JSON.parse(CREDS_JSON) : null;
  if (!creds) throw new Error("GOOGLE_CREDENTIALS not set");

  const { client_email, private_key } = creds;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const payload = `${b64(header)}.${b64(claim)}`;

  const { sign } = await import("node:crypto");
  const signature = sign("sha256", Buffer.from(payload), private_key);
  const jwt = `${payload}.${signature.toString("base64url")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Token error: ${data.error}`);
  return data.access_token;
}

const TAB = "Orders";

async function ensureTab(token: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json() as { sheets?: { properties: { title: string } }[] };
  const hasTab = data.sheets?.some((s) => s.properties.title === TAB);

  if (!hasTab) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          addSheet: { properties: { title: TAB } },
        }],
      }),
    });
    // Write header row
    const hdrUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${TAB}!A1:${String.fromCharCode(64 + HEADERS.length)}1?valueInputOption=RAW`;
    await fetch(hdrUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [HEADERS] }),
    });
  }
}

export async function readSheetRows(): Promise<OrderRow[]> {
  if (!SHEET_ID || !CREDS_JSON) return [];

  try {
    const token = await getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${TAB}!A:K?majorDimension=ROWS`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];

    const data = await res.json() as { values?: string[][] };
    const rows = data.values ?? [];
    if (rows.length < 2) return [];

    const [header, ...dataRows] = rows;
    return dataRows
      .filter((r) => r[0] && !isNaN(Number(r[0])))
      .map((r) => ({
        "Order ID": Number(r[0]),
        Date: r[1] ?? "",
        Status: r[2] ?? "",
        "Customer Name": r[3] ?? "",
        Phone: r[4] ?? "",
        Email: r[5] ?? "",
        Address: r[6] ?? "",
        City: r[7] ?? "",
        Governorate: r[8] ?? "",
        Items: r[9] ?? "",
        "Total (EGP)": Number(r[10] ?? 0),
      }));
  } catch { return []; }
}

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  if (!SHEET_ID || !CREDS_JSON) return;

  try {
    const token = await getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${TAB}!A:A?majorDimension=COLUMNS`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;

    const data = await res.json() as { values?: string[][] };
    const ids = data.values?.[0] ?? [];
    const rowIdx = ids.findIndex((v) => String(orderId) === v);
    if (rowIdx < 1) return; // not found (row 0 = header)

    const cellUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${TAB}!C${rowIdx + 1}?valueInputOption=RAW`;
    await fetch(cellUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [[status]] }),
    });
  } catch {}
}

export async function appendOrderRow(order: OrderRow): Promise<void> {
  if (!SHEET_ID || !CREDS_JSON) return;

  try {
    const token = await getAccessToken();
    await ensureTab(token);
    const row = HEADERS.map((h) => String(order[h] ?? ""));
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${TAB}!A:A:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Sheets append failed:", text);
    }
  } catch (err) {
    console.error("Sheets error:", err);
  }
}
