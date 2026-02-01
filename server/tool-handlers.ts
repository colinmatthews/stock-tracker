import type { ShowStockPerformanceInput, ShowStockPerformanceResponse, YahooFinanceChartResponse } from "./types.js";

/**
 * Handler for show_stock_performance tool
 * Fetches stock data from Yahoo Finance API and returns it in a format suitable for the UI widget
 */
export async function handleShowStockPerformance(
  args: ShowStockPerformanceInput
): Promise<ShowStockPerformanceResponse> {
  const { ticker } = args;

  try {
    // Build the full URL from the proxy action configuration
    const baseUrl = "https://query1.finance.yahoo.com";
    const path = `/v8/finance/chart/${ticker}`;
    const queryParams = new URLSearchParams({
      range: "1mo",
      interval: "1d",
    });

    const url = `${baseUrl}${path}?${queryParams.toString()}`;

    // Make the API request
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
    }

    const data: YahooFinanceChartResponse = await response.json();

    // Validate the response structure
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error(`No data found for ticker ${ticker}`);
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};

    // Extract price data
    const currentPrice = meta.regularMarketPrice || 0;
    const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    // Build chart data points
    const chartData = timestamps.map((timestamp, index) => ({
      timestamp: timestamp * 1000, // Convert to milliseconds
      date: new Date(timestamp * 1000).toISOString().split("T")[0],
      open: quotes.open?.[index] ?? null,
      high: quotes.high?.[index] ?? null,
      low: quotes.low?.[index] ?? null,
      close: quotes.close?.[index] ?? null,
      volume: quotes.volume?.[index] ?? null,
    }));

    // Prepare structured data for the widget
    const stockData = {
      ticker: ticker.toUpperCase(),
      symbol: meta.symbol || ticker.toUpperCase(),
      name: meta.longName || meta.shortName || ticker.toUpperCase(),
      currency: meta.currency || "USD",
      exchangeName: meta.exchangeName || meta.fullExchangeName || "Unknown",
      currentPrice,
      previousClose,
      change,
      changePercent,
      dayHigh: meta.regularMarketDayHigh || null,
      dayLow: meta.regularMarketDayLow || null,
      volume: meta.regularMarketVolume || null,
      marketCap: meta.marketCap || null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
      chartData,
      dataRange: "1mo",
      timestamp: Date.now(),
    };

    return {
      content: [
        {
          type: "text",
          text: `Stock data retrieved for ${stockData.name} (${stockData.symbol}): $${currentPrice.toFixed(2)} ${change >= 0 ? "+" : ""}${change.toFixed(2)} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%)`,
        },
      ],
      structuredContent: {
        ticker: stockData.ticker,
        symbol: stockData.symbol,
        name: stockData.name,
        currency: stockData.currency,
        exchangeName: stockData.exchangeName,
        currentPrice: stockData.currentPrice,
        previousClose: stockData.previousClose,
        change: stockData.change,
        changePercent: stockData.changePercent,
        dayHigh: stockData.dayHigh,
        dayLow: stockData.dayLow,
        volume: stockData.volume,
        marketCap: stockData.marketCap,
        fiftyTwoWeekHigh: stockData.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stockData.fiftyTwoWeekLow,
        chartData: stockData.chartData,
        dataRange: stockData.dataRange,
        timestamp: stockData.timestamp,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Error fetching stock data for ${ticker}:`, error);

    return {
      content: [
        {
          type: "text",
          text: `Failed to retrieve stock data for ${ticker}: ${errorMessage}`,
        },
      ],
      structuredContent: {
        error: true,
        message: errorMessage,
        ticker: ticker.toUpperCase(),
      },
      isError: true,
    };
  }
}