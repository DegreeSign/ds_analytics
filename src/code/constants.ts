/** IP Rate limits */
interface RateLimits {
    /** general visitor */
    generalAccess: number;
    /** white list */
    whiteListed: number;
    /** paid list */
    priorityAccess: number;
}

const
    /** IP range source */
    ipSourceUrl: string = "https://cdn.jsdelivr.net/npm/@ip-location-db/dbip-country/dbip-country-ipv4-num.csv",
    /** country codes ID */
    countriesCodes = { "AD": 1, "AE": 1, "AF": 1, "AG": 1, "AI": 1, "AL": 1, "AM": 1, "AO": 1, "AQ": 1, "AR": 1, "AS": 1, "AT": 1, "AU": 1, "AW": 1, "AX": 1, "AZ": 1, "BA": 1, "BB": 1, "BD": 1, "BE": 1, "BF": 1, "BG": 1, "BH": 1, "BI": 1, "BJ": 1, "BL": 1, "BM": 1, "BN": 1, "BO": 1, "BQ": 1, "BR": 1, "BS": 1, "BT": 1, "BV": 1, "BW": 1, "BY": 1, "BZ": 1, "CA": 1, "CC": 1, "CD": 1, "CF": 1, "CG": 1, "CH": 1, "CI": 1, "CK": 1, "CL": 1, "CM": 1, "CN": 1, "CO": 1, "CR": 1, "CU": 1, "CV": 1, "CW": 1, "CX": 1, "CY": 1, "CZ": 1, "DE": 1, "DJ": 1, "DK": 1, "DM": 1, "DO": 1, "DZ": 1, "EC": 1, "EE": 1, "EG": 1, "EH": 1, "ER": 1, "ES": 1, "ET": 1, "FI": 1, "FJ": 1, "FK": 1, "FM": 1, "FO": 1, "FR": 1, "GA": 1, "GB": 1, "GD": 1, "GE": 1, "GF": 1, "GG": 1, "GH": 1, "GI": 1, "GL": 1, "GM": 1, "GN": 1, "GP": 1, "GQ": 1, "GR": 1, "GS": 1, "GT": 1, "GU": 1, "GW": 1, "GY": 1, "HK": 1, "HM": 1, "HN": 1, "HR": 1, "HT": 1, "HU": 1, "ID": 1, "IE": 1, "IL": 1, "IM": 1, "IN": 1, "IO": 1, "IQ": 1, "IR": 1, "IS": 1, "IT": 1, "JE": 1, "JM": 1, "JO": 1, "JP": 1, "KE": 1, "KG": 1, "KH": 1, "KI": 1, "KM": 1, "KN": 1, "KP": 1, "KR": 1, "KW": 1, "KY": 1, "KZ": 1, "LA": 1, "LB": 1, "LC": 1, "LI": 1, "LK": 1, "LR": 1, "LS": 1, "LT": 1, "LU": 1, "LV": 1, "LY": 1, "MA": 1, "MC": 1, "MD": 1, "ME": 1, "MF": 1, "MG": 1, "MH": 1, "MK": 1, "ML": 1, "MM": 1, "MN": 1, "MO": 1, "MP": 1, "MQ": 1, "MR": 1, "MS": 1, "MT": 1, "MU": 1, "MV": 1, "MW": 1, "MX": 1, "MY": 1, "MZ": 1, "NA": 1, "NC": 1, "NE": 1, "NF": 1, "NG": 1, "NI": 1, "NL": 1, "NO": 1, "NP": 1, "NR": 1, "NU": 1, "NZ": 1, "OM": 1, "PA": 1, "PE": 1, "PF": 1, "PG": 1, "PH": 1, "PK": 1, "PL": 1, "PM": 1, "PN": 1, "PR": 1, "PS": 1, "PT": 1, "PW": 1, "PY": 1, "QA": 1, "RE": 1, "RO": 1, "RS": 1, "RU": 1, "RW": 1, "SA": 1, "SB": 1, "SC": 1, "SD": 1, "SE": 1, "SG": 1, "SH": 1, "SI": 1, "SJ": 1, "SK": 1, "SL": 1, "SM": 1, "SN": 1, "SO": 1, "SR": 1, "SS": 1, "ST": 1, "SV": 1, "SX": 1, "SY": 1, "SZ": 1, "TC": 1, "TD": 1, "TF": 1, "TG": 1, "TH": 1, "TJ": 1, "TK": 1, "TL": 1, "TM": 1, "TN": 1, "TO": 1, "TR": 1, "TT": 1, "TV": 1, "TW": 1, "TZ": 1, "UA": 1, "UG": 1, "UM": 1, "US": 1, "UY": 1, "UZ": 1, "VA": 1, "VC": 1, "VE": 1, "VG": 1, "VI": 1, "VN": 1, "VU": 1, "WF": 1, "WS": 1, "XK": 1, "YE": 1, "YT": 1, "ZA": 1, "ZM": 1, "ZW": 1, "UN": 1 } as const,
    /** IP rate limits */
    ipRateLimits: RateLimits = {
        generalAccess: 20,
        whiteListed: 100,
        priorityAccess: 500,
    };

type CountryCode = keyof typeof countriesCodes;

export {
    ipSourceUrl,
    CountryCode,
    countriesCodes,
    RateLimits,
    ipRateLimits,
}