/**
 * Reference implementation aligned with the Apps Script snippet in the product spec.
 * This repo syncs Sheet3 from Node (`googleSheets.ts`) using the same TTL and logic.
 * Use this file only if you move writes to a standalone Apps Script project.
 */

var CACHE_KEY = 'PHONE_INDEX_CACHE';
var CACHE_TTL = 21600; // 6 hours

function getColumnIndexByName(sheet, columnName) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.findIndex(function (h) {
    return String(h).trim().toLowerCase() === columnName.toLowerCase();
  });
}

function getPhoneCache() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(CACHE_KEY);
  return cached ? JSON.parse(cached) : null;
}

function buildPhoneCache(sheet, phoneColumnIndex) {
  var values = sheet.getDataRange().getValues();
  var phoneSet = {};
  for (var i = 1; i < values.length; i++) {
    var phone = String(values[i][phoneColumnIndex]).replace(/\D/g, '');
    if (phone) phoneSet[phone] = true;
  }
  CacheService.getScriptCache().put(CACHE_KEY, JSON.stringify(phoneSet), CACHE_TTL);
  return phoneSet;
}
