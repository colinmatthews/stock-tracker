// Stock Performance Tracker - Real-time data from Yahoo Finance
// Rebundle trigger
import React, { useState, useEffect, useRef } from 'react';
import { useWidgetProps, useToolInput, useDisplayMode, useRequestDisplayMode, useWidgetState, useCallTool } from 'sdk-hooks';
import { TrendingUp, TrendingDown, Maximize2, ArrowLeft, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface StockData {
  apiResponse?: {
    chart?: {
      result?: Array<{
        meta?: {
          symbol?: string;
          regularMarketPrice?: number;
          previousClose?: number;
          currency?: string;
          shortName?: string;
          exchangeName?: string;
          regularMarketDayHigh?: number;
          regularMarketDayLow?: number;
          regularMarketVolume?: number;
          fiftyTwoWeekHigh?: number;
          fiftyTwoWeekLow?: number;
        };
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            close?: (number | null)[];
            open?: (number | null)[];
            high?: (number | null)[];
            low?: (number | null)[];
            volume?: (number | null)[];
          }>;
        };
      }>;
      error?: { code?: string; description?: string };
    };
  };
}

export default function App() {
  const data = useWidgetProps<StockData | null>(null);
  const toolInput = useToolInput<{ ticker?: string }>();
  const displayMode = useDisplayMode();
  const requestDisplayMode = useRequestDisplayMode();
  const [state, setState] = useWidgetState({ selectedPeriod: '1mo' });
  const callTool = useCallTool();
  const [refreshing, setRefreshing] = useState(false);
  const [localData, setLocalData] = useState<StockData | null>(null);

  const ticker = (toolInput?.ticker ?? 'AAPL').toUpperCase();
  const effectiveData = localData || data;
  const result = effectiveData?.apiResponse?.chart?.result?.[0];
  const meta = result?.meta;
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];

  const currentPrice = meta?.regularMarketPrice ?? 0;
  const previousClose = meta?.previousClose ?? currentPrice;
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = previousClose > 0 ? (priceChange / previousClose) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Build chart data
  const chartData = timestamps.map((ts, i) => ({
    time: ts * 1000,
    price: closes[i] ?? null,
  })).filter(d => d.price !== null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: meta?.currency ?? 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(2) + 'K';
    return vol.toString();
  };

  // Loading state
  if (!effectiveData?.apiResponse) {
    return (
      <div className="w-full p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading {ticker} data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (effectiveData?.apiResponse?.chart?.error) {
    return (
      <div className="w-full p-6">
        <div className="text-center text-[var(--color-text-secondary)]">
          <p className="font-medium">Unable to load data for {ticker}</p>
          <p className="text-sm mt-1">{effectiveData.apiResponse.chart.error.description}</p>
        </div>
      </div>
    );
  }

  // Inline view - compact card
  if (displayMode !== 'fullscreen') {
    return (
      <div className="w-full">
        <div className="p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[var(--color-text)]">{ticker}</span>
                <span className="text-sm text-[var(--color-text-secondary)]">{meta?.exchangeName}</span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] truncate max-w-[200px]">
                {meta?.shortName ?? ticker}
              </p>
            </div>
            <button
              onClick={() => requestDisplayMode('fullscreen')}
              className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="text-3xl font-bold text-[var(--color-text)]">
              {formatPrice(currentPrice)}
            </div>
            <div className={`flex items-center gap-1 mt-1 ${isPositive ? 'text-[var(--green-600)]' : 'text-[var(--red-600)]'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-medium">
                {isPositive ? '+' : ''}{formatPrice(priceChange)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Mini Chart */}
          {chartData.length > 0 && (
            <div className="h-[80px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? 'var(--green-500)' : 'var(--red-500)'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isPositive ? 'var(--green-500)' : 'var(--red-500)'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? 'var(--green-500)' : 'var(--red-500)'}
                    strokeWidth={2}
                    fill={`url(#gradient-${ticker})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
            <div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Day High</div>
              <div className="text-sm font-medium text-[var(--color-text)]">
                {formatPrice(meta?.regularMarketDayHigh ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Day Low</div>
              <div className="text-sm font-medium text-[var(--color-text)]">
                {formatPrice(meta?.regularMarketDayLow ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Volume</div>
              <div className="text-sm font-medium text-[var(--color-text)]">
                {formatVolume(meta?.regularMarketVolume ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen view - detailed chart and metrics
  return (
    <div className="w-full min-h-screen bg-[var(--color-surface)] p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => requestDisplayMode('inline')}
            className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[var(--color-text)]">{ticker}</span>
              <span className="text-sm text-[var(--color-text-secondary)]">{meta?.exchangeName}</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">{meta?.shortName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[var(--color-text)]">{formatPrice(currentPrice)}</div>
          <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-[var(--green-600)]' : 'text-[var(--red-600)]'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-medium">
              {isPositive ? '+' : ''}{formatPrice(priceChange)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[var(--color-surface-secondary)] rounded-xl p-4 mb-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-full-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? 'var(--green-500)' : 'var(--red-500)'} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={isPositive ? 'var(--green-500)' : 'var(--red-500)'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tickFormatter={formatDate}
                stroke="var(--color-text-tertiary)"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v) => formatPrice(v)}
                stroke="var(--color-text-tertiary)"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                }}
                labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                formatter={(v: number) => [formatPrice(v), 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? 'var(--green-500)' : 'var(--red-500)'}
                strokeWidth={2}
                fill={`url(#gradient-full-${ticker})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--color-surface-secondary)] rounded-xl p-4">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">Previous Close</div>
          <div className="text-lg font-semibold text-[var(--color-text)]">{formatPrice(previousClose)}</div>
        </div>
        <div className="bg-[var(--color-surface-secondary)] rounded-xl p-4">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">Day Range</div>
          <div className="text-lg font-semibold text-[var(--color-text)]">
            {formatPrice(meta?.regularMarketDayLow ?? 0)} - {formatPrice(meta?.regularMarketDayHigh ?? 0)}
          </div>
        </div>
        <div className="bg-[var(--color-surface-secondary)] rounded-xl p-4">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">52 Week High</div>
          <div className="text-lg font-semibold text-[var(--color-text)]">{formatPrice(meta?.fiftyTwoWeekHigh ?? 0)}</div>
        </div>
        <div className="bg-[var(--color-surface-secondary)] rounded-xl p-4">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">52 Week Low</div>
          <div className="text-lg font-semibold text-[var(--color-text)]">{formatPrice(meta?.fiftyTwoWeekLow ?? 0)}</div>
        </div>
        <div className="bg-[var(--color-surface-secondary)] rounded-xl p-4">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">Volume</div>
          <div className="text-lg font-semibold text-[var(--color-text)]">{formatVolume(meta?.regularMarketVolume ?? 0)}</div>
        </div>
        <div className="bg-[var(--color-surface-secondary)] rounded-xl p-4">
          <div className="text-sm text-[var(--color-text-tertiary)] mb-1">Currency</div>
          <div className="text-lg font-semibold text-[var(--color-text)]">{meta?.currency ?? 'USD'}</div>
        </div>
      </div>
    </div>
  );
}