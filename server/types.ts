/**
 * Input type for show_stock_performance tool
 */
export interface ShowStockPerformanceInput {
  ticker: string;
}

/**
 * Yahoo Finance API response structure
 */
export interface YahooFinanceChart {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        exchangeName: string;
        instrumentType: string;
        firstTradeDate: number;
        regularMarketTime: number;
        gmtoffset: number;
        timezone: string;
        exchangeTimezoneName: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        previousClose: number;
        scale: number;
        priceHint: number;
        currentTradingPeriod: {
          pre: { timezone: string; start: number; end: number; gmtoffset: number };
          regular: { timezone: string; start: number; end: number; gmtoffset: number };
          post: { timezone: string; start: number; end: number; gmtoffset: number };
        };
        dataGranularity: string;
        range: string;
        validRanges: string[];
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          high: (number | null)[];
          volume: (number | null)[];
          close: (number | null)[];
          open: (number | null)[];
          low: (number | null)[];
        }>;
        adjclose?: Array<{
          adjclose: (number | null)[];
        }>;
      };
    }>;
    error: null | {
      code: string;
      description: string;
    };
  };
}

/**
 * Response type for show_stock_performance tool
 */
export interface ShowStockPerformanceResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  structuredContent: YahooFinanceChart | Record<string, unknown>;
}