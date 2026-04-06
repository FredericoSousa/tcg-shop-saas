import { getBrowser } from "../puppeteer";
import { logger } from "../logger";
import { convertSetCode } from "../constants/cardMappings";
import { Page } from "puppeteer-core";
import { JSDOM } from "jsdom";

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

/**
 * Progress tracking for collection import
 */
export type ImportProgress = {
  currentPage: number;
  totalPages: number;
  cardsProcessed: number;
  estimatedTimeRemaining: number; // in milliseconds
  estimatedTimeRemainingSeconds: number;
  validationRate: number; // percentage 0-100
  speed: number; // cards per second
  status: "fetching" | "parsing" | "validating" | "completed" | "error";
};

function extractCardsFromHtml(cardsHtml: string): CollectionCard[] {
  try {
    const dom = new JSDOM(
      `<html><body><table>${cardsHtml}</table></body></html>`,
    );
    const document = dom.window.document;
    return Array.from(document.querySelectorAll(".pointer"))
      .map((element) => {
        if (!element) return null;
        // More robust element access
        const quantityEl = element.children[0];
        const cardNumberEl = element.children[1];
        const cardNameEl = element.children[3];
        const setImageEl = element.children[2]
          ?.children[0] as HTMLImageElement | null;
        const languageImageEl = element.children[5]
          ?.children[0] as HTMLImageElement | null;
        const conditionEl = element.children[6];
        const priceEl = element.children[9];
        const extrasEl = element.children[4];

        // Fallback to position-based parsing if data attributes not found
        const quantity = Number(
          quantityEl?.textContent?.replace("x", "").trim() ?? 1,
        );
        const cardNumber =
          cardNumberEl?.textContent?.replace("#", "").trim() ?? "";

        if (!cardNumber || isNaN(quantity) || quantity < 1) {
          logger.debug("Skipping invalid card", {
            action: "extract_card_skip",
            reason: "invalid_data",
            cardNumber: cardNumber || "missing",
            quantity,
          });
          return null;
        }

        // Extract set code from image URL or data attribute
        let setCode =
          setImageEl
            ?.getAttribute("data-src")
            ?.split("/ed_mtg/")[1]
            ?.split(".")[0]
            ?.split("_")[0] ?? "";

        // Check for special set types
        const isStoreChampionship = /SC\d*/g.test(setCode?.toUpperCase() ?? "");
        const isPlayNetwork = /PW\d*/g.test(setCode?.toUpperCase() ?? "");
        const isMysteryBooster = /MB\d*/g.test(setCode?.toUpperCase() ?? "");

        const finalSetCode = convertSetCode(
          setCode,
          isStoreChampionship,
          isMysteryBooster,
          isPlayNetwork,
        );

        // Extract card name (handles double-faced cards) with deep guards

        const frontSideNameEl = cardNameEl?.children[0];
        const backSideNameEl = cardNameEl?.children[1]?.children[1];

        const frontSideName =
          frontSideNameEl?.children[1]?.textContent ??
          frontSideNameEl?.children[0]?.textContent;

        const backSideName =
          backSideNameEl?.children[1]?.textContent ??
          backSideNameEl?.children[0]?.textContent;

        let cardName = frontSideName as string;

        if (backSideName) {
          cardName = `${frontSideName} // ${backSideName}`;
        }

        // Extract language - safe URL parsing with fallback
        const language =
          languageImageEl?.src
            .split("/bandeiras/")?.[1]
            ?.replace(".svg", "")
            ?.toUpperCase() ?? "EN";

        // Extract condition
        const condition = conditionEl?.textContent?.trim() ?? "";

        // Extract price - safe parsing
        const price = parseFloat(
          priceEl?.textContent?.replace("R$", "").replace(",", ".") ?? "0",
        );

        // Extract extras - safe split
        let extras: string[] =
          extrasEl?.textContent
            ?.split(", ")
            ?.map((e: any) =>
              e
                .trim()
                .replaceAll(" / ", "/")
                .replaceAll(" ", "_")
                .toUpperCase(),
            )
            ?.filter(Boolean) ?? [];

        return {
          quantity,
          name: cardName || "Unknown",
          set: finalSetCode,
          cardNumber,
          price: isNaN(price) ? 0 : price,
          language,
          condition,
          extras,
        };
      })
      .filter(Boolean) as CollectionCard[];
  } catch (error) {
    logger.warn("Error extracting card from row", {
      action: "extract_card",
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Fetch cards from a single page
 */
async function fetchPageCards(
  page: Page,
  pageNumber: number,
  collectionId: string,
  onProgress?: (progress: ImportProgress) => void,
): Promise<{ cards: CollectionCard[]; parsedElements: number }> {
  const url = `https://www.ligamagic.com.br/?view=colecao/colecao&id=${collectionId}&modoExibicao=1&page=${pageNumber}`;

  try {
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

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for either data attributes or fallback to class-based selectors
    try {
      await page.waitForSelector(".pointer", {
        timeout: 30000,
      });
    } catch {
      logger.warn("Timeout waiting for cards selector", {
        action: "fetch_page_cards",
        page: pageNumber,
      });
      return { cards: [], parsedElements: 0 };
    }

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

    const cardsOnPage = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll(".pointer"));
      return rows.map((el) => el.outerHTML);
    });

    const cardsHtml = cardsOnPage.join("");
    const cards = extractCardsFromHtml(cardsHtml);
    return { cards, parsedElements: cardsOnPage.length };
  } catch (error) {
    logger.warn("Error fetching page cards", {
      action: "fetch_page_cards",
      page: pageNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    return { cards: [], parsedElements: 0 };
  }
}

/**
 * Fetch collection with parallel page processing
 * Significantly faster than sequential page fetching
 */
export async function getCollectionById(
  id: string,
  onProgress?: (progress: ImportProgress) => void,
): Promise<CollectionCard[]> {
  const timer = { start: Date.now() };
  let browser: any = null;
  const allCards: CollectionCard[] = [];
  let totalParsedElements = 0;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    // Set reasonable timeout
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // First, fetch first page to detect total pages
    const firstPageUrl = `https://www.ligamagic.com.br/?view=colecao/colecao&id=${id}&modoExibicao=1&page=1`;
    await page.goto(firstPageUrl, { waitUntil: "networkidle2" });

    // Try to find pagination info
    const pagination = await page.evaluate(() => {
      const paginationEl = document.querySelector(".direita-paginacao");
      if (!paginationEl) return { totalPages: 1 };

      try {
        const lastPageEl = Array.from(paginationEl.children).pop() as any;
        const lastPageUrl = new URL(lastPageEl?.href || "");
        const lastPageNumber =
          Number(lastPageUrl.searchParams.get("page")) ?? 1;
        return { totalPages: lastPageNumber };
      } catch {
        return { totalPages: 1 };
      }
    });

    logger.info("Starting collection import", {
      action: "import_ligamagic_collection",
      collectionId: id,
      estimatedPages: pagination.totalPages,
    });

    // Helper to calculate and emit progress
    const emitProgress = (
      currentPage: number,
      totalPages: number,
      status: ImportProgress["status"],
    ) => {
      const elapsedMs = Date.now() - timer.start;
      const avgTimePerPage = elapsedMs / Math.max(1, currentPage - 1);
      const remainingPages = Math.max(0, totalPages - currentPage);
      const estimatedTimeRemaining = remainingPages * avgTimePerPage;
      const cardsPerSecond =
        elapsedMs > 0 ? (allCards.length / elapsedMs) * 1000 : 0;
      const validationRate =
        totalParsedElements > 0
          ? Math.round((allCards.length / totalParsedElements) * 100)
          : 0;

      onProgress?.({
        currentPage,
        totalPages,
        cardsProcessed: allCards.length,
        estimatedTimeRemaining,
        estimatedTimeRemainingSeconds: Math.ceil(estimatedTimeRemaining / 1000),
        validationRate,
        speed: Math.round(cardsPerSecond * 100) / 100,
        status,
      });
    };

    // Fetch first page
    const firstResult = await fetchPageCards(page, 1, id, (p) =>
      emitProgress(1, pagination.totalPages, p.status),
    );
    allCards.push(...firstResult.cards);
    totalParsedElements += firstResult.parsedElements;

    emitProgress(1, pagination.totalPages, "validating");

    // Fetch remaining pages in parallel (max 3 concurrent to avoid overload)
    const pageNumbers = Array.from(
      { length: pagination.totalPages - 1 },
      (_, i) => i + 2,
    );

    if (pageNumbers.length > 0) {
      // Process in batches of 3
      const batchSize = 3;
      for (let i = 0; i < pageNumbers.length; i += batchSize) {
        const batch = pageNumbers.slice(i, i + batchSize);
        const pages = await Promise.all(batch.map(() => browser.newPage()));

        try {
          const results = await Promise.all(
            batch.map((pageNum, idx) =>
              fetchPageCards(pages[idx], pageNum, id, (p) =>
                emitProgress(pageNum, pagination.totalPages, p.status),
              ),
            ),
          );

          results.forEach((result) => {
            allCards.push(...result.cards);
            totalParsedElements += result.parsedElements;
          });

          emitProgress(
            Math.min(i + batchSize + 1, pagination.totalPages + 1),
            pagination.totalPages,
            "validating",
          );

          logger.debug("Batch completed", {
            action: "fetch_batch",
            batchPages: batch.length,
            totalCardsCollected: allCards.length,
            validationRate: `${Math.round((allCards.length / totalParsedElements) * 100)}%`,
          });
        } finally {
          // Close pages to free memory
          await Promise.all(pages.map((p) => p.close().catch(() => {})));
        }
      }
    }

    await page.close();

    logger.info("Collection import completed", {
      action: "import_ligamagic_collection",
      totalCards: allCards.length,
      duration: Date.now() - timer.start,
    });

    return allCards;
  } catch (error) {
    logger.error("Fatal error importing collection", error as Error, {
      action: "import_ligamagic_collection",
      collectionId: id,
    });
    return [];
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
