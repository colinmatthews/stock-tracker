/**
 * Input type for show_stock_performance tool
 */
export interface ShowStockPerformanceInput {
  ticker: string;
}

/**
 * Chart data point from Yahoo Finance
 */
export interface ChartDataPoint {
  timestamp: number;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

/**
 * Structured content for stock performance widget
 */
export interface StockPerformanceData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  currency: string;
  priceChange: number;
  priceChangePercent: number;
  previousClose: number;
  marketState: string;
  regularMarketTime: string | null;
  chartData: ChartDataPoint[];
  range: string;
  interval: string;
}

/**
 * Response type for show_stock_performance tool
 */
export interface ShowStockPerformanceResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  structuredContent?: StockPerformanceData;
  isError?: boolean;
}

/**
 * Yahoo Finance API response types
 */
export interface YahooFinanceChartResponse {
  chart: {
    result: Array<{
      meta: {
        currency?: string;
        symbol: string;
        regularMarketPrice?: number;
        previousClose?: number;
        regularMarketTime?: number;
        marketState?: string;
        longName?: string;
        shortName?: string;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error: null | {
      code: string;
      description: string;
    };
  };
}