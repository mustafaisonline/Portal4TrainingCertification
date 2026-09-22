/*
 * ISO 3166-1 alpha-2 country list (Milestone 5a — USER_PROFILE_REQUIREMENTS
 * §3.1: "ISO 3166-1 dropdown replaces today's free text"). English short
 * names, sorted by name at module load. Pure data — safe in the browser
 * bundle (the registration and profile forms render it) and on the server
 * (validation, `users.country` mirroring).
 *
 * `DIAL_CODES` is the smaller list behind the phone-number prefix select;
 * a country absent here can still be chosen as a country of residence.
 */

export type Country = { code: string; name: string };

const RAW: readonly (readonly [string, string])[] = [
  ["AF", "Afghanistan"], ["AX", "Åland Islands"], ["AL", "Albania"], ["DZ", "Algeria"], ["AS", "American Samoa"], ["AD", "Andorra"],
  ["AO", "Angola"], ["AI", "Anguilla"], ["AQ", "Antarctica"], ["AG", "Antigua and Barbuda"], ["AR", "Argentina"], ["AM", "Armenia"],
  ["AW", "Aruba"], ["AU", "Australia"], ["AT", "Austria"], ["AZ", "Azerbaijan"], ["BS", "Bahamas"], ["BH", "Bahrain"],
  ["BD", "Bangladesh"], ["BB", "Barbados"], ["BY", "Belarus"], ["BE", "Belgium"], ["BZ", "Belize"], ["BJ", "Benin"],
  ["BM", "Bermuda"], ["BT", "Bhutan"], ["BO", "Bolivia"], ["BQ", "Bonaire, Sint Eustatius and Saba"], ["BA", "Bosnia and Herzegovina"],
  ["BW", "Botswana"], ["BV", "Bouvet Island"], ["BR", "Brazil"], ["IO", "British Indian Ocean Territory"], ["BN", "Brunei Darussalam"],
  ["BG", "Bulgaria"], ["BF", "Burkina Faso"], ["BI", "Burundi"], ["CV", "Cabo Verde"], ["KH", "Cambodia"], ["CM", "Cameroon"],
  ["CA", "Canada"], ["KY", "Cayman Islands"], ["CF", "Central African Republic"], ["TD", "Chad"], ["CL", "Chile"], ["CN", "China"],
  ["CX", "Christmas Island"], ["CC", "Cocos (Keeling) Islands"], ["CO", "Colombia"], ["KM", "Comoros"], ["CG", "Congo"],
  ["CD", "Congo, Democratic Republic of the"], ["CK", "Cook Islands"], ["CR", "Costa Rica"], ["CI", "Côte d'Ivoire"], ["HR", "Croatia"],
  ["CU", "Cuba"], ["CW", "Curaçao"], ["CY", "Cyprus"], ["CZ", "Czechia"], ["DK", "Denmark"], ["DJ", "Djibouti"], ["DM", "Dominica"],
  ["DO", "Dominican Republic"], ["EC", "Ecuador"], ["EG", "Egypt"], ["SV", "El Salvador"], ["GQ", "Equatorial Guinea"], ["ER", "Eritrea"],
  ["EE", "Estonia"], ["SZ", "Eswatini"], ["ET", "Ethiopia"], ["FK", "Falkland Islands"], ["FO", "Faroe Islands"], ["FJ", "Fiji"],
  ["FI", "Finland"], ["FR", "France"], ["GF", "French Guiana"], ["PF", "French Polynesia"], ["TF", "French Southern Territories"],
  ["GA", "Gabon"], ["GM", "Gambia"], ["GE", "Georgia"], ["DE", "Germany"], ["GH", "Ghana"], ["GI", "Gibraltar"], ["GR", "Greece"],
  ["GL", "Greenland"], ["GD", "Grenada"], ["GP", "Guadeloupe"], ["GU", "Guam"], ["GT", "Guatemala"], ["GG", "Guernsey"], ["GN", "Guinea"],
  ["GW", "Guinea-Bissau"], ["GY", "Guyana"], ["HT", "Haiti"], ["HM", "Heard Island and McDonald Islands"], ["VA", "Holy See"],
  ["HN", "Honduras"], ["HK", "Hong Kong"], ["HU", "Hungary"], ["IS", "Iceland"], ["IN", "India"], ["ID", "Indonesia"], ["IR", "Iran"],
  ["IQ", "Iraq"], ["IE", "Ireland"], ["IM", "Isle of Man"], ["IL", "Israel"], ["IT", "Italy"], ["JM", "Jamaica"], ["JP", "Japan"],
  ["JE", "Jersey"], ["JO", "Jordan"], ["KZ", "Kazakhstan"], ["KE", "Kenya"], ["KI", "Kiribati"], ["KP", "Korea, Democratic People's Republic of"],
  ["KR", "Korea, Republic of"], ["KW", "Kuwait"], ["KG", "Kyrgyzstan"], ["LA", "Lao People's Democratic Republic"], ["LV", "Latvia"],
  ["LB", "Lebanon"], ["LS", "Lesotho"], ["LR", "Liberia"], ["LY", "Libya"], ["LI", "Liechtenstein"], ["LT", "Lithuania"], ["LU", "Luxembourg"],
  ["MO", "Macao"], ["MG", "Madagascar"], ["MW", "Malawi"], ["MY", "Malaysia"], ["MV", "Maldives"], ["ML", "Mali"], ["MT", "Malta"],
  ["MH", "Marshall Islands"], ["MQ", "Martinique"], ["MR", "Mauritania"], ["MU", "Mauritius"], ["YT", "Mayotte"], ["MX", "Mexico"],
  ["FM", "Micronesia"], ["MD", "Moldova"], ["MC", "Monaco"], ["MN", "Mongolia"], ["ME", "Montenegro"], ["MS", "Montserrat"], ["MA", "Morocco"],
  ["MZ", "Mozambique"], ["MM", "Myanmar"], ["NA", "Namibia"], ["NR", "Nauru"], ["NP", "Nepal"], ["NL", "Netherlands"], ["NC", "New Caledonia"],
  ["NZ", "New Zealand"], ["NI", "Nicaragua"], ["NE", "Niger"], ["NG", "Nigeria"], ["NU", "Niue"], ["NF", "Norfolk Island"],
  ["MK", "North Macedonia"], ["MP", "Northern Mariana Islands"], ["NO", "Norway"], ["OM", "Oman"], ["PK", "Pakistan"], ["PW", "Palau"],
  ["PS", "Palestine, State of"], ["PA", "Panama"], ["PG", "Papua New Guinea"], ["PY", "Paraguay"], ["PE", "Peru"], ["PH", "Philippines"],
  ["PN", "Pitcairn"], ["PL", "Poland"], ["PT", "Portugal"], ["PR", "Puerto Rico"], ["QA", "Qatar"], ["RE", "Réunion"], ["RO", "Romania"],
  ["RU", "Russian Federation"], ["RW", "Rwanda"], ["BL", "Saint Barthélemy"], ["SH", "Saint Helena, Ascension and Tristan da Cunha"],
  ["KN", "Saint Kitts and Nevis"], ["LC", "Saint Lucia"], ["MF", "Saint Martin (French part)"], ["PM", "Saint Pierre and Miquelon"],
  ["VC", "Saint Vincent and the Grenadines"], ["WS", "Samoa"], ["SM", "San Marino"], ["ST", "Sao Tome and Principe"], ["SA", "Saudi Arabia"],
  ["SN", "Senegal"], ["RS", "Serbia"], ["SC", "Seychelles"], ["SL", "Sierra Leone"], ["SG", "Singapore"], ["SX", "Sint Maarten (Dutch part)"],
  ["SK", "Slovakia"], ["SI", "Slovenia"], ["SB", "Solomon Islands"], ["SO", "Somalia"], ["ZA", "South Africa"],
  ["GS", "South Georgia and the South Sandwich Islands"], ["SS", "South Sudan"], ["ES", "Spain"], ["LK", "Sri Lanka"], ["SD", "Sudan"],
  ["SR", "Suriname"], ["SJ", "Svalbard and Jan Mayen"], ["SE", "Sweden"], ["CH", "Switzerland"], ["SY", "Syrian Arab Republic"], ["TW", "Taiwan"],
  ["TJ", "Tajikistan"], ["TZ", "Tanzania"], ["TH", "Thailand"], ["TL", "Timor-Leste"], ["TG", "Togo"], ["TK", "Tokelau"], ["TO", "Tonga"],
  ["TT", "Trinidad and Tobago"], ["TN", "Tunisia"], ["TR", "Türkiye"], ["TM", "Turkmenistan"], ["TC", "Turks and Caicos Islands"], ["TV", "Tuvalu"],
  ["UG", "Uganda"], ["UA", "Ukraine"], ["AE", "United Arab Emirates"], ["GB", "United Kingdom"], ["US", "United States"],
  ["UM", "United States Minor Outlying Islands"], ["UY", "Uruguay"], ["UZ", "Uzbekistan"], ["VU", "Vanuatu"], ["VE", "Venezuela"], ["VN", "Viet Nam"],
  ["VG", "Virgin Islands (British)"], ["VI", "Virgin Islands (U.S.)"], ["WF", "Wallis and Futuna"], ["EH", "Western Sahara"], ["YE", "Yemen"],
  ["ZM", "Zambia"], ["ZW", "Zimbabwe"],
];

const collator = new Intl.Collator("en");

/** Every ISO 3166-1 alpha-2 country, sorted by English name. */
export const COUNTRIES: readonly Country[] = RAW.map(([code, name]) => ({ code, name })).sort((a, b) => collator.compare(a.name, b.name));

const byCode = new Map(COUNTRIES.map((c) => [c.code, c.name]));

export function isCountryCode(value: string | null | undefined): value is string {
  return typeof value === "string" && byCode.has(value);
}

/** English short name for a code; null when the code is not ISO 3166-1. */
export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return byCode.get(code.toUpperCase()) ?? null;
}

/** The code for a legacy free-text `users.country` value ("Malaysia", "my",
 *  "Pakistan.") — null when it matches neither a code nor a name. */
export function countryCodeFor(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim().replace(/[.]+$/, "");
  if (isCountryCode(v.toUpperCase())) return v.toUpperCase();
  const lower = v.toLowerCase();
  return COUNTRIES.find((c) => c.name.toLowerCase() === lower)?.code ?? null;
}

export type DialCode = { code: string; dial: string };

/** Dialling prefixes for the phone-number select — the countries most likely
 *  to register; the E.164 number stored is the same whichever country shares
 *  a prefix (US/CA, RU/KZ). Sorted by country name at module load. */
const RAW_DIAL: readonly (readonly [string, string])[] = [
  ["MY", "+60"], ["PK", "+92"], ["SG", "+65"], ["ID", "+62"], ["TH", "+66"], ["VN", "+84"], ["PH", "+63"], ["IN", "+91"], ["BD", "+880"],
  ["LK", "+94"], ["NP", "+977"], ["MV", "+960"], ["BN", "+673"], ["KH", "+855"], ["MM", "+95"], ["AE", "+971"], ["SA", "+966"], ["QA", "+974"],
  ["KW", "+965"], ["BH", "+973"], ["OM", "+968"], ["JO", "+962"], ["LB", "+961"], ["IQ", "+964"], ["IR", "+98"], ["AF", "+93"], ["EG", "+20"],
  ["TR", "+90"], ["IL", "+972"], ["GB", "+44"], ["IE", "+353"], ["US", "+1"], ["CA", "+1"], ["AU", "+61"], ["NZ", "+64"], ["DE", "+49"],
  ["FR", "+33"], ["NL", "+31"], ["BE", "+32"], ["CH", "+41"], ["AT", "+43"], ["ES", "+34"], ["PT", "+351"], ["IT", "+39"], ["SE", "+46"],
  ["NO", "+47"], ["DK", "+45"], ["FI", "+358"], ["PL", "+48"], ["RU", "+7"], ["KZ", "+7"], ["UA", "+380"], ["JP", "+81"], ["KR", "+82"],
  ["CN", "+86"], ["HK", "+852"], ["MO", "+853"], ["TW", "+886"], ["NG", "+234"], ["KE", "+254"], ["ZA", "+27"], ["GH", "+233"], ["ET", "+251"],
  ["TZ", "+255"], ["MA", "+212"], ["BR", "+55"], ["MX", "+52"], ["AR", "+54"], ["CL", "+56"], ["CO", "+57"],
];

export const DIAL_CODES: readonly DialCode[] = RAW_DIAL.map(([code, dial]) => ({ code, dial })).sort((a, b) =>
  collator.compare(byCode.get(a.code) ?? a.code, byCode.get(b.code) ?? b.code),
);

export function isDialCode(value: string | null | undefined): boolean {
  return typeof value === "string" && DIAL_CODES.some((d) => d.dial === value);
}
