import { logger } from "../logger";
import { convertSetCode } from "../constants/card-mappings";
import * as cheerio from "cheerio";

export type CollectionCard = {
  quantity: number;
  name: string;
  set: string;
  cardNumber: string;
  price: number;
  language?: string;
  condition?: string;
  extras: string[];
};

export type ImportProgress = {
  currentPage: number;
  totalPages: number;
  cardsProcessed: number;
  estimatedTimeRemaining: number;
  estimatedTimeRemainingSeconds: number;
  validationRate: number;
  speed: number;
  status: "fetching" | "parsing" | "validating" | "completed" | "error";
};

type RawCard = {
  quantityText: string | null | undefined;
  cardNumberText: string | null | undefined;
  setImageSrc: string | null | undefined;
  cardNameFront: string | null | undefined;
  cardNameBack: string | null | undefined;
  languageSrc: string | null | undefined;
  condition: string | null | undefined;
  priceText: string | null | undefined;
  extrasText: string | null | undefined;
};

function processRawCards(rawCards: RawCard[]): CollectionCard[] {
  try {
    return rawCards.map((raw) => {
      const quantity = Number(raw.quantityText?.replace("x", "").trim() ?? 1);
      const cardNumber = raw.cardNumberText?.replace("#", "").trim() ?? "";

      if (!cardNumber || isNaN(quantity) || quantity < 1) {
        return null;
      }

      const setCode = raw.setImageSrc?.split("/ed_mtg/")[1]?.split(".")[0]?.split("_")[0] ?? "";
      
      const isStoreChampionship = /SC\d+/g.test(setCode?.toUpperCase() ?? "");
      const isPlayNetwork = /PW\d+/g.test(setCode?.toUpperCase() ?? "");
      const isMysteryBooster = /MB\d+/g.test(setCode?.toUpperCase() ?? "");

      const finalSetCode = convertSetCode(setCode, isStoreChampionship, isMysteryBooster, isPlayNetwork);

      let cardName = (raw.cardNameFront as string) || "Unknown";
      if (raw.cardNameBack) {
        cardName = `${raw.cardNameFront} // ${raw.cardNameBack}`;
      }

      const language = raw.languageSrc?.split("/bandeiras/")?.[1]?.replace(".svg", "")?.toUpperCase() ?? "EN";
      const condition = raw.condition?.trim() ?? "";
      const price = parseFloat(raw.priceText?.replace("R$", "").replace(",", ".") ?? "0");

      const extras = raw.extrasText?.split(", ")?.map((e: string) => e.trim().replaceAll(" / ", "/").replaceAll(" ", "_").toUpperCase())?.filter(Boolean) ?? [];

      return {
        quantity,
        name: cardName,
        set: finalSetCode,
        cardNumber,
        price: isNaN(price) ? 0 : price,
        language,
        condition,
        extras,
      };
    }).filter(Boolean) as CollectionCard[];
  } catch (error) {
    logger.warn("Error processing raw cards", {
      action: "process_raw_cards",
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function fetchHtml(url: string, useProxy = process.env.NODE_ENV !== "development"): Promise<string> {
  const fetchUrl = useProxy ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url;
  const response = await fetch(fetchUrl, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      "Sec-Ch-Ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1"
    }
  });

  if (!response.ok) {
    if (!useProxy && response.status === 403) {
      logger.warn(`403 received, trying proxy for ${url}`, { action: "fetch_proxy_fallback" });
      return fetchHtml(url, true);
    }
    throw new Error(`Failed to fetch ${url}, status: ${response.status}`);
  }

  const html = await response.text();
  
  // Ligamagic Cloudflare block payload usually contains
  if (!useProxy && (html.includes("cf-browser-verification") || html.includes("Just a moment..."))) {
    logger.warn(`Cloudflare JS Challenge received, trying proxy for ${url}`, { action: "fetch_proxy_fallback" });
    return fetchHtml(url, true);
  }

  return html;
}

async function fetchPageCards(
  pageNumber: number,
  collectionId: string,
  onProgress?: (progress: ImportProgress) => void,
): Promise<{ cards: CollectionCard[]; parsedElements: number }> {
  try {
    const url = `https://www.ligamagic.com.br/?view=colecao/colecao&id=${collectionId}&modoExibicao=1&page=${pageNumber}`;
    
    onProgress?.({
      currentPage: pageNumber,
      totalPages: 0,
      cardsProcessed: 0,
      estimatedTimeRemaining: 0,
      estimatedTimeRemainingSeconds: 0,
      validationRate: 0,
      speed: 0,
      status: "fetching",
    });

    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const rows = $(".pointer");
    
    onProgress?.({
      currentPage: pageNumber,
      totalPages: 0,
      cardsProcessed: 0,
      estimatedTimeRemaining: 0,
      estimatedTimeRemainingSeconds: 0,
      validationRate: 0,
      speed: 0,
      status: "parsing",
    });

    const rawCards: RawCard[] = [];
    
    rows.each((_, el) => {
      const element = $(el);
      const children = element.children();
      
      const quantityEl = children.eq(0);
      const cardNumberEl = children.eq(1);
      const cardNameEl = children.eq(3);
      const setImageEl = children.eq(2).find("img").first();
      const languageImageEl = children.eq(5).find("img").first();
      const conditionEl = children.eq(6);
      const priceEl = children.eq(9);
      const extrasEl = children.eq(4);

      const frontSideNameEl = cardNameEl.children().eq(0);
      const backSideNameEl = cardNameEl.children().eq(1).children().eq(1);

      const frontSideName = frontSideNameEl.children().eq(1).text() || frontSideNameEl.children().eq(0).text() || frontSideNameEl.text();
      const backSideName = backSideNameEl.children().eq(1).text() || backSideNameEl.children().eq(0).text() || backSideNameEl.text() || null;

      rawCards.push({
        quantityText: quantityEl.text(),
        cardNumberText: cardNumberEl.text(),
        setImageSrc: setImageEl.attr("data-src"),
        cardNameFront: frontSideName?.trim() || null,
        cardNameBack: backSideName?.trim() || null,
        languageSrc: languageImageEl.attr("src"),
        condition: conditionEl.text(),
        priceText: priceEl.text(),
        extrasText: extrasEl.text(),
      });
    });

    const cards = processRawCards(rawCards);
    return { cards, parsedElements: rawCards.length };
  } catch (error) {
    logger.warn("Error fetching page cards", { action: "fetch_page_cards", page: pageNumber, error: String(error) });
    return { cards: [], parsedElements: 0 };
  }
}

export async function getCollectionById(
  id: string,
  onProgress?: (progress: ImportProgress) => void,
): Promise<CollectionCard[]> {
  const timer = { start: Date.now() };
  const allCards: CollectionCard[] = [];
  let totalParsedElements = 0;

  try {
    const firstPageUrl = `https://www.ligamagic.com.br/?view=colecao/colecao&id=${id}&modoExibicao=1&page=1`;
    const html = await fetchHtml(firstPageUrl);
    const $ = cheerio.load(html);
    
    let totalPages = 1;
    const lastPageEl = $(".direita-paginacao a").last();
    if (lastPageEl.length) {
      try {
        const href = lastPageEl.attr("href") || "";
        const match = href.match(/page=(\d+)/);
        if (match) {
          totalPages = parseInt(match[1], 10);
        }
      } catch {
        totalPages = 1;
      }
    }
    
    const emitProgress = (currentPage: number, tPages: number, status: ImportProgress["status"]) => {
      const elapsedMs = Date.now() - timer.start;
      const avgTimePerPage = elapsedMs / Math.max(1, currentPage - 1);
      const remainingPages = Math.max(0, tPages - currentPage);
      const estimatedTimeRemaining = remainingPages * avgTimePerPage;
      const cardsPerSecond = elapsedMs > 0 ? (allCards.length / elapsedMs) * 1000 : 0;
      const validationRate = totalParsedElements > 0 ? Math.round((allCards.length / totalParsedElements) * 100) : 0;

      onProgress?.({
        currentPage,
        totalPages: tPages,
        cardsProcessed: allCards.length,
        estimatedTimeRemaining,
        estimatedTimeRemainingSeconds: Math.ceil(estimatedTimeRemaining / 1000),
        validationRate,
        speed: Math.round(cardsPerSecond * 100) / 100,
        status,
      });
    };

    const firstResult = await fetchPageCards(1, id, (p) => emitProgress(1, totalPages, p.status));
    allCards.push(...firstResult.cards);
    totalParsedElements += firstResult.parsedElements;
    emitProgress(1, totalPages, "validating");

    const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

    if (pageNumbers.length > 0) {
      const batchSize = 3;
      for (let i = 0; i < pageNumbers.length; i += batchSize) {
        const batch = pageNumbers.slice(i, i + batchSize);
        const results = await Promise.all(batch.map((pageNum) => 
          fetchPageCards(pageNum, id, (p) => emitProgress(pageNum, totalPages, p.status))
        ));

        results.forEach((result) => {
          allCards.push(...result.cards);
          totalParsedElements += result.parsedElements;
        });

        emitProgress(Math.min(i + batchSize + 1, totalPages + 1), totalPages, "validating");
      }
    }

    logger.info("Collection import completed", { action: "import_ligamagic_collection", totalCards: allCards.length, duration: Date.now() - timer.start });
    return allCards;
  } catch (error) {
    logger.error("Fatal error importing collection", error as Error, { action: "import_ligamagic_collection", collectionId: id });
    return [];
  }
}
