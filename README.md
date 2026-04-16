# pagemark-cli

> Command-line bookmark manager with tagging and full-text search backed by SQLite

## Installation

```bash
npm install -g pagemark-cli
```

## Usage

```bash
# Add a bookmark
pagemark add https://example.com --title "Example Site" --tags dev,reference

# Search bookmarks
pagemark search "typescript tutorial"

# List all bookmarks
pagemark list

# Filter by tag
pagemark list --tag dev

# Delete a bookmark
pagemark delete <id>
```

Bookmarks are stored in a local SQLite database at `~/.pagemark/bookmarks.db`.

## Commands

| Command | Description |
|---------|-------------|
| `add <url>` | Add a new bookmark |
| `list` | List all bookmarks |
| `search <query>` | Full-text search across titles and URLs |
| `delete <id>` | Remove a bookmark by ID |
| `tags` | List all tags |

## Requirements

- Node.js 16 or higher

## License

MIT