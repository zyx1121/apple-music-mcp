```
███╗   ███╗██╗   ██╗███████╗██╗ ██████╗
████╗ ████║██║   ██║██╔════╝██║██╔════╝
██╔████╔██║██║   ██║███████╗██║██║     
██║╚██╔╝██║██║   ██║╚════██║██║██║     
██║ ╚═╝ ██║╚██████╔╝███████║██║╚██████╗
╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝ ╚═════╝
                                       
```

# @zyx1121/apple-music-mcp

MCP server for Apple Music — control playback, manage playlists, and search your library via Claude Code.

## Install

```bash
claude mcp add apple-music -- npx @zyx1121/apple-music-mcp
```

## Prerequisites

- macOS with Music.app configured
- Node.js >= 18
- First run will prompt for Automation permission (System Settings > Privacy & Security > Automation)

## Tools

### Playback

| Tool | Description |
|------|-------------|
| `music_get_status` | Get current playback status and track info |
| `music_play` | Play or resume music |
| `music_pause` | Pause music |
| `music_next` | Skip to next track |
| `music_previous` | Go to previous track |
| `music_set_volume` | Set volume (0-100) |
| `music_set_shuffle` | Enable or disable shuffle |
| `music_set_repeat` | Set repeat mode (off, one, all) |
| `music_play_track` | Play a specific track by searching for it |
| `music_play_next` | Queue a track to play next |
| `music_get_queue` | Get info about the currently playing track |

### Playlists

| Tool | Description |
|------|-------------|
| `music_get_playlists` | List all playlists |
| `music_play_playlist` | Play a specific playlist |
| `music_get_playlist_tracks` | List tracks in a playlist |
| `music_create_playlist` | Create a new playlist |
| `music_add_to_playlist` | Add a track to a playlist by searching for it |
| `music_remove_from_playlist` | Remove a track from a playlist by name |

### Library

| Tool | Description |
|------|-------------|
| `music_search` | Search tracks in the music library |

## Examples

```
"What's playing?"                → music_get_status
"Play some music"                → music_play
"Skip this song"                 → music_next
"Set volume to 50"               → music_set_volume { volume: 50 }
"Search for Coldplay"            → music_search { query: "Coldplay" }
"Play Yellow"                    → music_play_track { query: "Yellow" }
"Create a playlist"              → music_create_playlist { name: "Chill Vibes" }
"Add song to playlist"           → music_add_to_playlist { playlist: "Chill Vibes", query: "Yellow" }
"Show playlist tracks"           → music_get_playlist_tracks { playlist: "Chill Vibes" }
```

## Limitations

- macOS only (uses AppleScript via `osascript`)
- Music.app must be running
- Apple Music does not expose a queue/up-next API via AppleScript — `music_get_queue` returns current track info only

## License

MIT
