/**
 * Google Apps Script — Order Webhook for NŌKA
 * Deploy as Web App → execute as "me" → who has access "Anyone"
 * Copy the deployment URL → set as GOOGLE_SHEETS_WEBHOOK_URL
 */

const SHEET_NAME = "Orders";

function doPost(e) {
  try {
    const order = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);

    const headers = [
      "Order ID", "Date", "Status",
      "Customer Name", "Email", "Phone",
      "Address", "City", "Governorate",
      "Total (EGP)",
      "Items"
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    const items = (order.items || [])
      .map(i => `${i.productName} x${i.quantity}${i.size ? ` (${i.size})` : ""}`)
      .join(", ");

    sheet.appendRow([
      order.id,
      order.createdAt,
      order.status,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.address,
      order.city,
      order.governorate,
      (order.total * 50).toFixed(2),
      items
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("NŌKA Order Webhook Active");
}
