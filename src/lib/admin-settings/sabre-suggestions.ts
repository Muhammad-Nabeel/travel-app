/**
 * Suggested values for a first-time Sabre setup. The admin form pre-fills these;
 * runtime code only ever uses what is saved in the database.
 */
export const SABRE_BASE_URL_PRESETS = [
    { label: "Certification (test)", url: "https://api.cert.platform.sabre.com" },
    { label: "Production", url: "https://api.platform.sabre.com" },
] as const;

export const SUGGESTED_SABRE_FLIGHT_SEARCH_PATH = "/v5/offers/shop";
export const SUGGESTED_SABRE_FARE_CALENDAR_PATH = "/v6.1.0/shop/altdates/flights?mode=live";

export const SUGGESTED_SABRE_VENDOR_CODES = [
    "AZ",
    "CX",
    "CZ",
    "EK",
    "EY",
    "GF",
    "KL",
    "KU",
    "LX",
    "PK",
    "QR",
    "SV",
    "TG",
    "TK",
    "UL",
    "6S",
    "YO",
    "FZ",
    "HY",
    "LH",
    "WY",
    "PC",
    "VS",
    "KQ",
    "AC",
    "AF",
    "SQ",
    "DV",
    "GP",
    "ET",
    "DL",
    "AT",
    "J2",
    "PF",
    "HR",
    "MS",
    "ER",
    "SZ",
    "XY",
    "PR",
    "OD",
    "RJ",
];
