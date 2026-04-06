/**
 * Centralized mappings for LigaMagic to Scryfall conversions
 * Manutenção centralizada de todas as transformações
 */

export const LIGAMAGIC_TO_SCRYFALL_SET_CODE: Record<string, string> = {
  LA: "PLGM", // Promo: League
  MT: "MOR", // Morningtide
  LW: "LRW", // Lorwyn
  PC: "PLC", // Planar Chaos
  TS: "TSP", // Time Spiral
  CS: "CSP", // Coldsnap
  DI: "DIS", // Dissension
  CP: "PCMP", // Champs Promos
  GP: "GPT", // Guildpact
  "9E": "9ED", // Ninth Edition
  UH: "UNH", // Unhinged
  DS: "DST", // Darksteel
  MI: "MRD", // Mirrodin
  "8E": "8ED", // Eighth Edition
  SC: "SCG", // Scourge
  LE: "LGN", // Legions
  ON: "ONS", // Onslaught
  JU: "JUD", // Judgment
  TR: "TOR", // Torment
  OD: "ODY", // Odyssey
  DM: "DKM", // Deckmasters
  AP: "APC", // Apocalypse
  "7E": "7ED", // Seventh Edition
  PS: "PLS", // Planeshift
  IN: "INV", // Invasion
  BD: "BTD", // Beatdown Box Set
  PR: "PCY", // Prophecy
  NE: "NEM", // Nemesis
  BR: "BRB", // Battle Royale Box Set
  MM: "MMQ", // Mercadian Masques
  ST: "S99", // Starter 1999
  UD: "UDS", // Urza's Destiny
  "6E": "6ED", // Classic Sixth Edition
  UL: "ULG", // Urza's Legacy
  AT: "ATH", // Anthologies
  US: "USG", // Urza's Saga
  UG: "UGL", // Unglued
  EX: "EXO", // Exodus
  SH: "STH", // Stronghold
  JR: "JGP", // Judge Gift Program
  TP: "TMP", // Tempest
  WL: "WTH", // Weatherlight
  PO: "POR", // Portal
  "5E": "5ED", // Fifth Edition
  VI: "VIS", // Visions
  MR: "MIR", // Mirage
  AI: "ALL", // Alliances
  HL: "HML", // Homelands
  RI: "RIN", // Rinascimento
  RE: "REN", // Renaissance
  CH: "CHR", // Chronicles
  IA: "ICE", // Ice Age
  "4E": "4ED", // Fourth Edition
  FE: "FEM", // Fallen Empires
  DK: "DRK", // The Dark
  LG: "LEG", // Legends
  RV: "3ED", // Revised Edition
  AQ: "ATQ", // Antiquities
  UN: "2ED", // Unlimited Edition
  AN: "ARN", // Arabian Nights
  BE: "LEB", // Limited Edition Beta
  AL: "LEA", // Limited Edition Alpha
};

export const LIGAMAGIC_CONDITIONS: Record<string, string> = {
  "1": "M",
  "2": "NM",
  "3": "SP",
  "4": "MP",
  "5": "HP",
  "6": "D",
};

export const LIGAMAGIC_LANGUAGES: Record<string, string> = {
  "1": "DE",
  "2": "EN",
  "3": "ES",
  "4": "FR",
  "5": "IT",
  "6": "JA",
  "7": "KO",
  "8": "PT",
  "9": "RU",
  "10": "TW",
  "11": "PT-EN",
  "12": "TK",
  "16": "PH",
  "0": "NA",
};

export const LIGAMAGIC_EXTRAS: Record<number, string> = {
  2: "FOIL",
  3: "PROMO",
  5: "PRE_RELEASE",
  7: "FNM",
  11: "DCI",
  13: "TEXTLESS",
  17: "SIGNED",
  23: "OVERSIZED",
  29: "ALTERED",
  31: "FOIL_ETCHED",
  37: "MISPRINT",
  41: "MISCUT",
};

/**
 * Convert LigaMagic set code to Scryfall set code
 */
export function convertSetCode(
  ligaMagicCode: string,
  isStoreChampionship: boolean,
  isMysteryBooster: boolean,
  isPlayNetwork: boolean,
): string {
  if (isStoreChampionship) return "SCH";
  if (isMysteryBooster || ligaMagicCode === "PLIST") return "PLST";
  if (isPlayNetwork) return ligaMagicCode;

  if (ligaMagicCode.length < 3) {
    return (
      LIGAMAGIC_TO_SCRYFALL_SET_CODE[ligaMagicCode] ??
      ligaMagicCode.padEnd(3, "X")
    );
  }

  return ligaMagicCode.slice(-3);
}

/**
 * Extract extras flags from combined number
 */
export function extractExtras(extrasTotal: number): string[] {
  if (!extrasTotal) return [];
  return Object.entries(LIGAMAGIC_EXTRAS).reduce(
    (extras: string[], [id, extra]) => {
      if (extrasTotal % Number(id) === 0) {
        extras.push(extra);
      }
      return extras;
    },
    [],
  );
}
