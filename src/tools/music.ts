import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runAppleScript, escapeForAppleScript } from "../applescript.js";
import { success, withErrorHandling } from "../helpers.js";

export function registerMusicTools(server: McpServer) {
  // Get current playback status
  server.registerTool(
    "music_get_status",
    {
      description: "Get current Music app playback status and track info",
      inputSchema: {},
    },
    withErrorHandling(async () => {
      const raw = await runAppleScript(`
tell application "Music"
  set playerSt to (player state as string)
  set vol to sound volume
  set shuf to shuffle enabled
  set rep to (song repeat as string)
  set pos to player position
  set trackInfo to ""
  try
    set t to current track
    set dur to duration of t
    set trackInfo to (name of t) & "\\t" & (artist of t) & "\\t" & (album of t) & "\\t" & (genre of t) & "\\t" & (year of t as string) & "\\t" & (dur as integer as string)
  end try
  return playerSt & "\\t" & vol & "\\t" & shuf & "\\t" & rep & "\\t" & (pos as integer as string) & "\\t" & trackInfo
end tell`);
      const parts = raw.split("\t");
      const [state, volume, shuffle, repeat, position, name, artist, album, genre, year, duration] = parts;
      const status: Record<string, unknown> = {
        state,
        volume: Number(volume),
        shuffle: shuffle === "true",
        repeat,
        position: Number(position),
      };
      if (name) {
        status.track = { name, artist, album, genre, year: Number(year), duration: Number(duration) };
      }
      return success(status);
    }),
  );

  // Play / resume
  server.registerTool(
    "music_play",
    {
      description: "Play or resume music",
      inputSchema: {},
    },
    withErrorHandling(async () => {
      await runAppleScript(`tell application "Music" to play`);
      return success({ playing: true });
    }),
  );

  // Pause
  server.registerTool(
    "music_pause",
    {
      description: "Pause music",
      inputSchema: {},
    },
    withErrorHandling(async () => {
      await runAppleScript(`tell application "Music" to pause`);
      return success({ paused: true });
    }),
  );

  // Next track
  server.registerTool(
    "music_next",
    {
      description: "Skip to next track",
      inputSchema: {},
    },
    withErrorHandling(async () => {
      await runAppleScript(`tell application "Music" to next track`);
      return success({ skipped: true });
    }),
  );

  // Previous track
  server.registerTool(
    "music_previous",
    {
      description: "Go to previous track",
      inputSchema: {},
    },
    withErrorHandling(async () => {
      await runAppleScript(`tell application "Music" to previous track`);
      return success({ previous: true });
    }),
  );

  // Set volume
  server.registerTool(
    "music_set_volume",
    {
      description: "Set music volume (0-100)",
      inputSchema: z.object({
        volume: z.coerce.number().min(0).max(100).describe("Volume level 0-100"),
      }),
    },
    withErrorHandling(async ({ volume }) => {
      await runAppleScript(`tell application "Music" to set sound volume to ${volume}`);
      return success({ volume });
    }),
  );

  // Set shuffle
  server.registerTool(
    "music_set_shuffle",
    {
      description: "Enable or disable shuffle",
      inputSchema: z.object({
        enabled: z.coerce.boolean().describe("true to enable shuffle, false to disable"),
      }),
    },
    withErrorHandling(async ({ enabled }) => {
      await runAppleScript(`tell application "Music" to set shuffle enabled to ${enabled}`);
      return success({ shuffle: enabled });
    }),
  );

  // Set repeat
  server.registerTool(
    "music_set_repeat",
    {
      description: "Set repeat mode",
      inputSchema: z.object({
        mode: z.enum(["off", "one", "all"]).describe("Repeat mode: off, one, all"),
      }),
    },
    withErrorHandling(async ({ mode }) => {
      const asMode = mode === "off" ? "off" : mode === "one" ? "one" : "all";
      await runAppleScript(`tell application "Music" to set song repeat to ${asMode}`);
      return success({ repeat: mode });
    }),
  );

  // Get playlists
  server.registerTool(
    "music_get_playlists",
    {
      description: "List all playlists",
      inputSchema: {},
    },
    withErrorHandling(async () => {
      const raw = await runAppleScript(`
tell application "Music"
  set output to ""
  repeat with pl in every playlist
    set cnt to count of tracks of pl
    set output to output & (name of pl) & "\\t" & (class of pl as string) & "\\t" & cnt & "\\n"
  end repeat
  return output
end tell`);
      const playlists = raw
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [name, kind, count] = line.split("\t");
          return { name, kind, trackCount: Number(count) };
        });
      return success(playlists);
    }),
  );

  // Play playlist
  server.registerTool(
    "music_play_playlist",
    {
      description: "Play a specific playlist",
      inputSchema: z.object({
        name: z.string().describe("Playlist name"),
        shuffle: z.coerce.boolean().optional().describe("Enable shuffle before playing"),
      }),
    },
    withErrorHandling(async ({ name, shuffle }) => {
      const esc = escapeForAppleScript(name);
      const shuffleCmd = shuffle !== undefined ? `set shuffle enabled to ${shuffle}\n  ` : "";
      await runAppleScript(`
tell application "Music"
  ${shuffleCmd}play playlist "${esc}"
end tell`);
      return success({ playing: name, shuffle: shuffle ?? undefined });
    }),
  );

  // Get playlist tracks
  server.registerTool(
    "music_get_playlist_tracks",
    {
      description: "List tracks in a playlist",
      inputSchema: z.object({
        name: z.string().describe("Playlist name"),
        limit: z.coerce.number().default(50).describe("Max tracks to return (default 50)"),
      }),
    },
    withErrorHandling(async ({ name, limit }) => {
      const esc = escapeForAppleScript(name);
      const raw = await runAppleScript(`
tell application "Music"
  set pl to playlist "${esc}"
  set output to ""
  set cnt to 0
  repeat with t in tracks of pl
    if cnt >= ${limit} then exit repeat
    set output to output & (name of t) & "\\t" & (artist of t) & "\\t" & (album of t) & "\\t" & (duration of t as integer as string) & "\\n"
    set cnt to cnt + 1
  end repeat
  return output
end tell`);
      const tracks = raw
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [name, artist, album, duration] = line.split("\t");
          return { name, artist, album, duration: Number(duration) };
        });
      return success(tracks);
    }),
  );

  // Search library
  server.registerTool(
    "music_search",
    {
      description: "Search tracks in the music library",
      inputSchema: z.object({
        query: z.string().min(1).describe("Search keyword"),
        limit: z.coerce.number().default(20).describe("Max results (default 20)"),
      }),
    },
    withErrorHandling(async ({ query, limit }) => {
      const esc = escapeForAppleScript(query);
      const raw = await runAppleScript(`
tell application "Music"
  set results to search playlist "Library" for "${esc}"
  set output to ""
  set cnt to 0
  repeat with t in results
    if cnt >= ${limit} then exit repeat
    set output to output & (name of t) & "\\t" & (artist of t) & "\\t" & (album of t) & "\\t" & (duration of t as integer as string) & "\\n"
    set cnt to cnt + 1
  end repeat
  return output
end tell`);
      const tracks = raw
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [name, artist, album, duration] = line.split("\t");
          return { name, artist, album, duration: Number(duration) };
        });
      return success(tracks);
    }),
  );

  // Play search result
  server.registerTool(
    "music_play_track",
    {
      description: "Search and immediately play the first matching track",
      inputSchema: z.object({
        query: z.string().min(1).describe("Track name or artist to search and play"),
      }),
    },
    withErrorHandling(async ({ query }) => {
      const esc = escapeForAppleScript(query);
      const raw = await runAppleScript(`
tell application "Music"
  set results to search playlist "Library" for "${esc}"
  if (count of results) is 0 then return "NOT_FOUND"
  set t to item 1 of results
  play t
  return (name of t) & "\\t" & (artist of t) & "\\t" & (album of t)
end tell`);
      if (raw === "NOT_FOUND") return success({ error: `No track found for "${query}"` });
      const [name, artist, album] = raw.split("\t");
      return success({ playing: { name, artist, album } });
    }),
  );
}
