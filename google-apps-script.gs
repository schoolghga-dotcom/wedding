const SHEET_NAME = "Ответы";
const ADMIN_TOKEN = "admin2026";
const HEADERS = [
  "submittedAt",
  "guestName",
  "attendance",
  "companions",
  "guestCount",
  "kids",
  "drinks",
  "drinkFinal",
];

function doGet(event) {
  const params = event.parameter || {};
  const callback = getCallbackName(params.callback);

  try {
    if (params.token !== ADMIN_TOKEN) {
      return jsonp(callback, { ok: false, error: "Bad token" });
    }

    const action = params.action || "";
    if (action === "save") {
      return jsonp(callback, saveResponse(params));
    }
    if (action === "list") {
      return jsonp(callback, listResponses());
    }
    if (action === "delete") {
      return jsonp(callback, deleteResponse(params.guestName || ""));
    }
    if (action === "ping") {
      return jsonp(callback, { ok: true });
    }

    return jsonp(callback, { ok: false, error: "Unknown action" });
  } catch (error) {
    return jsonp(callback, { ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function saveResponse(params) {
  const guestName = String(params.guestName || "").trim();
  if (!guestName) {
    return { ok: false, error: "Guest name is required" };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet();
    const row = HEADERS.map((header) => {
      if (header === "submittedAt") {
        return params.submittedAt || new Date().toISOString();
      }
      return params[header] || "";
    });
    const existingRow = findGuestRow(sheet, guestName);

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function listResponses() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { ok: true, responses: [] };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
  const responses = rows
    .filter((row) => row.some(Boolean))
    .map((row) => {
      const item = {};
      HEADERS.forEach((header, index) => {
        item[header] = row[index] || "";
      });
      return item;
    });

  return { ok: true, responses };
}

function deleteResponse(guestName) {
  const normalizedGuestName = String(guestName || "").trim().toLowerCase();
  if (!normalizedGuestName) {
    return { ok: false, error: "Guest name is required" };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    let deleted = 0;

    for (let rowIndex = lastRow; rowIndex >= 2; rowIndex -= 1) {
      const value = String(sheet.getRange(rowIndex, 2).getValue() || "").trim().toLowerCase();
      if (value === normalizedGuestName) {
        sheet.deleteRow(rowIndex);
        deleted += 1;
      }
    }

    return { ok: true, deleted };
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => firstRow[index] === header);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function findGuestRow(sheet, guestName) {
  const normalizedGuestName = String(guestName || "").trim().toLowerCase();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return -1;
  }

  const names = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let index = 0; index < names.length; index += 1) {
    const value = String(names[index][0] || "").trim().toLowerCase();
    if (value === normalizedGuestName) {
      return index + 2;
    }
  }

  return -1;
}

function getCallbackName(callback) {
  const fallback = "callback";
  const value = String(callback || fallback);
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(value) ? value : fallback;
}

function jsonp(callback, payload) {
  return ContentService.createTextOutput(`${callback}(${JSON.stringify(payload)});`).setMimeType(
    ContentService.MimeType.JAVASCRIPT
  );
}
