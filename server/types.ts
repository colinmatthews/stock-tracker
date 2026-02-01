/**
 * Input type for show_stock_performance tool
 */
export interface ShowStockPerformanceInput {
  ticker: string;
}

/**
 * Chart data point structure
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
 * Stock data structure returned by the handler
 */
export interface StockData {
  ticker: string;
  symbol: string;
  name: string;
  currency: string;
  exchangeName: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  chartData: ChartDataPoint[];
  dataRange: string;
  timestamp: number;
}

/**
 * Error response structure
 */
export interface ErrorData {
  error: true;
  message: string;
  ticker: string;
}

/**
 * Response type for show_stock_performance tool
 */
export interface ShowStockPerformanceResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  structuredContent: StockData | ErrorData;
  isError?: boolean;
}

/**
 * Yahoo Finance API response types
 */
export interface YahooFinanceChartResponse {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        exchangeName?: string;
        fullExchangeName?: string;
        instrumentType?: string;
        firstTradeDate?: number;
        regularMarketTime?: number;
        gmtoffset?: number;
        timezone?: string;
        exchangeTimezoneName?: string;
        regularMarketPrice: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
        longName?: string;
        shortName?: string;
        marketCap?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        priceHint?: number;
        currentTradingPeriod?: any;
        dataGranularity?: string;
        range?: string;
        validRanges?: string[];
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
        adjclose?: Array<{
          adjclose?: (number | null)[];
        }>;
      };
    }>;
    error?: {
      code: string;
      description: string;
    } | null;
  };
}

/**
 * MCP tool response content item
 */
export interface ToolResponseContent {
  type: string;
  text: string;
}

/**
 * MCP tool response structure
 */
export interface ToolResponse {
  content: ToolResponseContent[];
  structuredContent?: any;
  isError?: boolean;
}