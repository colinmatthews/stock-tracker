import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { handleShowStockPerformance } from "./tool-handlers";

// Read widget HTML files for UI tools
const showStockPerformanceWidgetHtml = readFileSync(
  "public/show_stock_performance-widget.html",
  "utf8"
);

// Define input schemas using zod
const showStockPerformanceInputSchema = {
  ticker: z.string().min(1).describe("Stock ticker symbol (e.g., AAPL, TSLA, MSFT)"),
};

function createAppServer() {
  const server = new McpServer({ name: "stock-tracker", version: "0.1.0" });

  // Register resources (UI widgets) for UI tools
  server.registerResource(
    "show_stock_performance",
    "template://widgets/show_stock_performance",
    {},
    async () => ({
      contents: [
        {
          uri: "template://widgets/show_stock_performance",
          mimeType: "text/html+skybridge",
          text: showStockPerformanceWidgetHtml,
          _meta: {
            "openai/widgetPrefersBorder": true,
            "openai/widgetAccessible": true,
            "openai/widgetDescription": "Display stock performance with price, change, and charts",
            "openai/widgetCSP": {
              frame_domains: [],
              connect_domains: [
                "https://api.mapbox.com",
                "https://events.mapbox.com",
                "https://tiles.mapbox.com",
                "https://a.tiles.mapbox.com",
                "https://b.tiles.mapbox.com",
                "https://c.tiles.mapbox.com",
                "https://d.tiles.mapbox.com"
              ],
              redirect_domains: [],
              resource_domains: [
                "https://api.mapbox.com",
                "https://tiles.mapbox.com",
                "https://a.tiles.mapbox.com",
                "https://b.tiles.mapbox.com",
                "https://c.tiles.mapbox.com",
                "https://d.tiles.mapbox.com",
                "https://images.unsplash.com",
                "https://storage.googleapis.com"
              ],
            },
          },
        },
      ],
    })
  );

  // Register tools with FULL _meta from mcpMeta
  server.registerTool(
    "show_stock_performance",
    {
      title: "Show Stock Performance",
      description: "Display stock performance with price, change, and charts. Pass a stock ticker symbol like AAPL, TSLA, MSFT, GOOGL, AMZN.\n\nExample: { \"ticker\": \"AAPL\" }",
      inputSchema: showStockPerformanceInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        "openai/outputTemplate": "template://widgets/show_stock_performance",
        "openai/widgetAccessible": true,
      },
    },
    async (args) => {
      return await handleShowStockPerformance(args);
    }
  );

  return server;
}

// HTTP server setup
const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  // CORS preflight — must allow mcp-session-id header
  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain" }).end("MCP Server");
    return;
  }

  // MCP endpoint — MUST handle POST, GET (SSE streaming), and DELETE (session cleanup)
  const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createAppServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    // Clean up resources when the connection closes
    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(`MCP server listening on http://localhost:${port}${MCP_PATH}`);
});