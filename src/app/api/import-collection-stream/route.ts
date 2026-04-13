import { NextRequest } from "next/server";
import { getCollectionById } from "@/lib/scrapers/liga-magic-scraper";
import type { ImportProgress } from "@/lib/scrapers/liga-magic-scraper";

// Allows the function to run longer on Vercel (up to 60s for Hobby/Pro limits, 300s max for Pro)
export const maxDuration = 300;

/**
 * SSE endpoint for streaming LigaMagic collection import progress
 * Usage: const source = new EventSource(`/api/import-collection-stream?id=123456`)
 */
export async function GET(request: NextRequest) {
  const collectionId = request.nextUrl.searchParams.get("id");

  if (!collectionId) {
    return new Response("Collection ID is required", { status: 400 });
  }

  // Create a ReadableStream that sends progress updates
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Define progress callback that sends SSE events
        const onProgress = (progress: ImportProgress) => {
          const data = `data: ${JSON.stringify(progress)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        };

        // Start import with progress callback
        const cards = await getCollectionById(collectionId, onProgress);

        // Send completion event
        const finalProgress: ImportProgress = {
          currentPage: cards.length > 0 ? Math.ceil(cards.length / 30) : 0,
          totalPages: Math.ceil(cards.length / 30) || 1,
          cardsProcessed: cards.length,
          estimatedTimeRemaining: 0,
          estimatedTimeRemainingSeconds: 0,
          validationRate: 100,
          speed: 0,
          status: "completed",
        };

        const finalData = `data: ${JSON.stringify(finalProgress)}\n\n`;
        controller.enqueue(new TextEncoder().encode(finalData));

        controller.close();
      } catch {
        const errorProgress: ImportProgress = {
          currentPage: 0,
          totalPages: 0,
          cardsProcessed: 0,
          estimatedTimeRemaining: 0,
          estimatedTimeRemainingSeconds: 0,
          validationRate: 0,
          speed: 0,
          status: "error",
        };

        const errorData = `data: ${JSON.stringify(errorProgress)}\n\n`;
        controller.enqueue(new TextEncoder().encode(errorData));

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Encoding": "none",
    },
  });
}
