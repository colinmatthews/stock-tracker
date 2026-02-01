import type {
  ShowStockPerformanceInput,
  ShowStockPerformanceResponse,
  YahooFinanceChartResponse,
} from "./types";

/**
 * Handler for show_stock_performance tool
 * Fetches stock chart data from Yahoo Finance API
 */
export async function handleShowStockPerformance(
  args: ShowStockPerformanceInput
): Promise<ShowStockPerformanceResponse> {
  const { ticker } = args;

  try {
    // Build the full URL with parameter substitution
    const baseUrl = "https://query1.finance.yahoo.com";
    const path = `/v8/finance/chart/${ticker}`;
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      range: "1mo",
      interval: "1d",
    });

    const url = `${baseUrl}${path}?${queryParams.toString()}`;

    // Make the fetch request
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Yahoo Finance API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data: YahooFinanceChartResponse = await response.json();

    // Validate response structure
    if (!data.chart?.result?.[0]) {
      throw new Error("Invalid response structure from Yahoo Finance API");
    }

    const chartData = data.chart.result[0];
    const meta = chartData.meta;
    const timestamps = chartData.timestamp || [];
    const quotes = chartData.indicators?.quote?.[0];

    if (!quotes) {
      throw new Error("No quote data available");
    }

    // Build chart data points
    const chartPoints = timestamps.map((timestamp, index) => ({
      timestamp,
      date: new Date(timestamp * 1000).toISOString(),
      open: quotes.open?.[index] ?? null,
      high: quotes.high?.[index] ?? null,
      low: quotes.low?.[index] ?? null,
      close: quotes.close?.[index] ?? null,
      volume: quotes.volume?.[index] ?? null,
    }));

    // Calculate price change and percentage
    const currentPrice = meta.regularMarketPrice || 0;
    const previousClose = meta.previousClose || currentPrice;
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = previousClose !== 0 ? (priceChange / previousClose) * 100 : 0;

    // Prepare structured content for the widget
    const structuredContent = {
      ticker: ticker.toUpperCase(),
      companyName: meta.longName || meta.shortName || ticker.toUpperCase(),
      currentPrice: currentPrice,
      currency: meta.currency || "USD",
      priceChange: priceChange,
      priceChangePercent: priceChangePercent,
      previousClose: previousClose,
      marketState: meta.marketState || "REGULAR",
      regularMarketTime: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : null,
      chartData: chartPoints,
      range: "1mo",
      interval: "1d",
    };

    return {
      content: [
        {
          type: "text",
          text: `Stock data for ${ticker.toUpperCase()}: $${currentPrice.toFixed(2)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}, ${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`,
        },
      ],
      structuredContent,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      content: [
        {
          type: "text",
          text: `Error fetching stock data for ${ticker}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}