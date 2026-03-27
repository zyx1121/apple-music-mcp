import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMusicTools } from "./tools/music.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "apple-music",
    version: "0.1.0",
  });

  registerMusicTools(server);

  return server;
}
