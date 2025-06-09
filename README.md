# MCP Random Server

A Model Context Protocol (MCP) server that provides cryptographically secure random numbers and randomized resources.

## Features

### 🔧 Tools (8 available)
- **`random-number`** - Generate secure random integers within a range
- **`random-decimal`** - Generate secure random decimal numbers with precision control
- **`random-choice`** - Pick random items from a list (with or without duplicates)
- **`shuffle-list`** - Randomly shuffle a list using Fisher-Yates algorithm
- **`random-string`** - Generate random strings with different character sets
- **`roll-dice`** - Roll dice with custom sides and modifiers
- **`generate-uuid`** - Generate cryptographically secure UUIDs (v4)
- **`random-bytes`** - Generate raw cryptographic bytes in various encodings

### 📊 Resources (2 available)
- **`random://facts/numbers`** - Static resource with random number facts
- **`random://dataset/{type}`** - Dynamic datasets (numbers, coordinates, colors, names)

### 📝 Prompts (2 available)
- **`random-story-starter`** - Generate random story prompts by genre
- **`random-writing-exercise`** - Create creative writing exercises by difficulty

## Security

All randomness is **cryptographically secure** using Node.js `crypto` module:
- Uses `crypto.randomInt()` for integers
- Uses `crypto.randomBytes()` for floats and raw bytes
- Uses `crypto.randomUUID()` for UUIDs
- Suitable for security-sensitive applications

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

## Usage

The server uses stdio transport, making it compatible with MCP clients that support stdio.

### Example Tool Calls

```bash
# Generate 5 random numbers between 1-100
{"method": "tools/call", "params": {"name": "random-number", "arguments": {"min": 1, "max": 100, "count": 5}}}

# Generate a secure password-like string
{"method": "tools/call", "params": {"name": "random-string", "arguments": {"length": 16, "charset": "alphanumeric"}}}

# Roll 3 six-sided dice with +2 modifier
{"method": "tools/call", "params": {"name": "roll-dice", "arguments": {"sides": 6, "count": 3, "modifier": 2}}}

# Generate UUIDs
{"method": "tools/call", "params": {"name": "generate-uuid", "arguments": {"count": 3, "format": "no-hyphens"}}}

# Generate 32 random bytes in base64
{"method": "tools/call", "params": {"name": "random-bytes", "arguments": {"size": 32, "encoding": "base64"}}}
```

### Example Resource Access

```bash
# Get random number facts
{"method": "resources/read", "params": {"uri": "random://facts/numbers"}}

# Get random coordinate dataset
{"method": "resources/read", "params": {"uri": "random://dataset/coordinates"}}
```

### Example Prompt Usage

```bash
# Get a fantasy story starter
{"method": "prompts/get", "params": {"name": "random-story-starter", "arguments": {"genre": "fantasy", "character": "Aria"}}}

# Get an advanced writing exercise
{"method": "prompts/get", "params": {"name": "random-writing-exercise", "arguments": {"difficulty": "advanced", "timeLimit": 20}}}
```

## Directory Structure

```
mcp-rando-server/
├── server.ts       # Complete MCP server implementation
├── package.json    # Node.js dependencies and scripts
└── README.md       # This file
```

## Requirements

- Node.js 18+
- TypeScript (for development)

## License

MIT
