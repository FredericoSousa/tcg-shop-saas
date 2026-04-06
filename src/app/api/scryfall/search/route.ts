import { NextRequest, NextResponse } from "next/server";
import { scryfall } from "@/lib/scryfall";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  try {
    const cards = await scryfall.searchCards(query);
    return NextResponse.json(cards);
  } catch (error) {
    console.error("Scryfall search error:", error);
    return NextResponse.json(
      { error: "Error searching Scryfall" },
      { status: 500 },
    );
  }
}
