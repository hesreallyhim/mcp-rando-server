# mcp-rando-server

A Model Context Protocol (MCP) server that provides cryptographically secure random numbers and randomized resources. Uses stdio transport for clients to ensure private data need not leave the user's local machine, and Node's `crypto` module for strong randomization.

> NOTE: This server has not been tested in production - do not rely on it for security-critical applications without thorough testing.

## Features

### 🔧 Tools (9 available)

- **`random-number`** - Generate secure random integers within a range
- **`random-decimal`** - Generate secure random decimal numbers with precision control
- **`random-choice`** - Pick random items from a list (with or without duplicates)
- **`shuffle-list`** - Randomly shuffle a list using Fisher-Yates algorithm
- **`random-string`** - Generate random strings with different character sets
- **`roll-dice`** - Roll dice with custom sides and modifiers
- **`generate-uuid`** - Generate cryptographically secure UUIDs (v4)
- **`random-bytes`** - Generate raw cryptographic bytes in various encodings
- **`diceware-passphrase`** - Generate secure passphrases using the Diceware method

### 📊 Resources and Resource Templates (3 available)

- **`random://facts/numbers`** - Static resource with random number facts
- **`random://dataset/{type}`** - Dynamic datasets (numbers, coordinates, colors, names)
- **`wordlist://{filename}`** - Access EFF Diceware wordlists for passphrase generation

### 📝 Prompts (4 available)

- **`random-story-starter`** - Generate random story prompts by genre
- **`random-writing-exercise`** - Create creative writing exercises by difficulty
- **`diceware-security-guide`** - Generate security guidance for diceware passphrase creation and usage
- **`password-policy-advisor`** - Generate advice for creating diceware-friendly password policies

### 🌳 Roots

- N/A - The server does not perform any operations that touch the filesystem or require persistent storage.

## Security

All randomness is **cryptographically secure** using the Node.js `crypto` module:

- Uses `crypto.randomInt()` for integers
- Uses `crypto.randomBytes()` for floats and raw bytes
- Uses `crypto.randomUUID()` for UUIDs
- Suitable for security-sensitive applications

### Diceware Passphrases

The server includes support for generating secure passphrases using the [Diceware method](https://theworld.com/~reinhold/diceware.html):

- **Method**: Generates cryptographically secure dice rolls (1-6) to select words from curated wordlists
- **Wordlists**: Includes [Electronic Frontier Foundation (EFF)](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases) wordlists optimized for memorability and security, as well as removing obscene or obscure words.
- **Memorability**: Uses common English words that are easy to remember and type

Available wordlists:

- `short_wordlist_unique_prefixes.txt` - 1296 words, unique 3-character prefixes (default)
- `short_wordlist.txt` - 1296 words, standard EFF short list
- `large_wordlist.txt` - 7776 words, full EFF list for maximum security
- `original_reinhold_wordlist.txt` - 7776 words, original Diceware list

![XKCD comic about password strength](https://imgs.xkcd.com/comics/password_strength.png)

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

# Generate a 5-word diceware passphrase
{"method": "tools/call", "params": {"name": "diceware-passphrase", "arguments": {"words": 5, "wordlist": "short_wordlist_unique_prefixes.txt", "capitalize": false}}}

# Generate a 6-word capitalized passphrase using the large wordlist
{"method": "tools/call", "params": {"name": "diceware-passphrase", "arguments": {"words": 6, "wordlist": "large_wordlist.txt", "capitalize": true}}}
```

### Example Resource Access

```bash
# Get random number facts
{"method": "resources/read", "params": {"uri": "random://facts/numbers"}}

# Get random coordinate dataset
{"method": "resources/read", "params": {"uri": "random://dataset/coordinates"}}

# Access a specific diceware wordlist
{"method": "resources/read", "params": {"uri": "wordlist://short_wordlist_unique_prefixes.txt"}}

# Access the large EFF wordlist
{"method": "resources/read", "params": {"uri": "wordlist://large_wordlist.txt"}}
```

### Example Prompt Usage

```bash
# Get a fantasy story starter
{"method": "prompts/get", "params": {"name": "random-story-starter", "arguments": {"genre": "fantasy", "character": "Aria"}}}

# Get an advanced writing exercise
{"method": "prompts/get", "params": {"name": "random-writing-exercise", "arguments": {"difficulty": "advanced", "timeLimit": 20}}}
```

## Requirements

- Node.js 18+
- TypeScript (for development)

## License

MIT
