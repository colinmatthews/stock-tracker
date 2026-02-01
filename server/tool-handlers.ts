import type { ShowStockPerformanceInput, ShowStockPerformanceResponse } from "./types";

/**
 * Handler for show_stock_performance tool
 * Fetches stock performance data from Yahoo Finance API
 */
export async function handleShowStockPerformance(
  args: ShowStockPerformanceInput
): Promise<ShowStockPerformanceResponse> {
  const { ticker } = args;

  // Build the full URL from proxyAction configuration
  const baseUrl = "https://query1.finance.yahoo.com";
  const path = `/v8/finance/chart/${ticker}`;
  const queryParams = new URLSearchParams({
    range: "1mo",
    interval: "1d",
  });

  const url = `${baseUrl}${path}?${queryParams.toString()}`;

  try {
    // Make the direct fetch call to Yahoo Finance API
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MCPStockTracker/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Yahoo Finance API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Return structured content for the widget
    // The widget expects the full Yahoo Finance API response structure
    return {
      content: [
        {
          type: "text",
          text: `Successfully fetched stock performance data for ${ticker}`,
        },
      ],
      structuredContent: data,
    };
  } catch (error) {
    console.error("Error fetching stock performance:", error);
    throw new Error(
      `Failed to fetch stock performance for ${ticker}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}