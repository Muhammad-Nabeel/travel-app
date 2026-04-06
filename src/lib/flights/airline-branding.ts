const AIRLINE_LOGO_BY_CODE: Record<string, string> = {
    "9W": "/airlines/9w.gif",
    AA: "/airlines/aa.gif",
    AC: "/airlines/ac.gif",
    AZ: "/airlines/az.gif",
    BA: "/airlines/BA.jpg",
    CA: "/airlines/ca.gif",
    CX: "/airlines/cx.gif",
    CZ: "/airlines/cz.gif",
    DL: "/airlines/dl.gif",
    EI: "/airlines/ei.gif",
    EK: "/airlines/ek.gif",
    ER: "/airlines/serene-logo.jpg",
    ET: "/airlines/ET.png",
    EY: "/airlines/EY.png",
    FZ: "/airlines/fz.png",
    G9: "/airlines/Air-Arabia-Logo.jpg",
    GF: "/airlines/gf.gif",
    HY: "/airlines/hy.gif",
    JJ: "/airlines/jj.gif",
    KL: "/airlines/kl.gif",
    KU: "/airlines/ku.gif",
    LH: "/airlines/lh.gif",
    LX: "/airlines/lx.gif",
    OD: "/airlines/od.gif",
    PA: "/airlines/PA.gif",
    PF: "/airlines/pf.png",
    PK: "/airlines/pk.png",
    QR: "/airlines/qr.gif",
    RJ: "/airlines/rj.gif",
    SV: "/airlines/sv.gif",
    TG: "/airlines/tg.gif",
    TK: "/airlines/tk.gif",
    UL: "/airlines/ul.gif",
    VS: "/airlines/VS_sq.gif",
    WR: "/airlines/wr.gif",
    WY: "/airlines/wy.gif",
    XY: "/airlines/XY.png",
    YO: "/airlines/yo.gif",
};

const AIRLINE_CODE_BY_NAME: Record<string, string> = {
    "AIR ARABIA": "G9",
    "AIR CHINA": "CA",
    AIRBLUE: "PA",
    AIRSIAL: "PF",
    "BRITISH AIRWAYS": "BA",
    EMIRATES: "EK",
    ETHIOPIAN: "ET",
    ETIHAD: "EY",
    FLYDUBAI: "FZ",
    LUFTHANSA: "LH",
    LATAM: "JJ",
    "OMAN AIR": "WY",
    "QATAR AIRWAYS": "QR",
    SAUDIA: "SV",
    "SERENE AIR": "ER",
    "SRILANKAN AIRLINES": "UL",
    "ROYAL JORDANIAN": "RJ",
    "TURKISH AIRLINES": "TK",
    "VIRGIN ATLANTIC": "VS",
};

function normalizeValue(value?: string) {
    return value?.trim().toUpperCase() ?? "";
}

export function getAirlineCode(...values: Array<string | undefined>) {
    for (const value of values) {
        const normalized = normalizeValue(value);
        if (!normalized) {
            continue;
        }

        if (AIRLINE_CODE_BY_NAME[normalized]) {
            return AIRLINE_CODE_BY_NAME[normalized];
        }

        if (AIRLINE_LOGO_BY_CODE[normalized]) {
            return normalized;
        }

        const compactCode = normalized.slice(0, 3);
        if (AIRLINE_LOGO_BY_CODE[compactCode]) {
            return compactCode;
        }
    }

    return normalizeValue(values[0]).slice(0, 3);
}

export function getAirlineLogoSrc(...values: Array<string | undefined>) {
    const code = getAirlineCode(...values);
    return AIRLINE_LOGO_BY_CODE[code];
}