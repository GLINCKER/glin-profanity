<p align="center">
  <a href="https://www.glincker.com/tools/glin-profanity" target="_blank">
    <img src="../../assets/glinr-logo.png" alt="Glin Profanity" width="40" /> 
  </a>
</p>

<h1 align="center">GLIN PROFANITY</h1>

<p align="center">
  <strong>A multilingual profanity detection and filtering engine for modern applications — by <a href="https://glincker.com">GLINCKER</a></strong>
</p>
<p align="center">
  <a href="https://www.glincker.com/tools/glin-profanity">
    <img src="https://img.shields.io/badge/🚀%20Try%20Live%20Demo-online-blue" alt="Try Live Demo" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/glin-profanity">
    <img src="https://img.shields.io/npm/v/glin-profanity" alt="NPM Version" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/GLINCKER/glin-profanity/ci.yml" alt="CI Status" />
  </a>
  <a href="https://www.npmjs.com/package/glin-profanity">
    <img src="https://img.shields.io/npm/dw/glin-profanity" alt="Weekly Downloads" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/issues">
    <img src="https://img.shields.io/github/issues/GLINCKER/glin-profanity" alt="Open Issues" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/pulls">
    <img src="https://img.shields.io/github/issues-pr/GLINCKER/glin-profanity" alt="Open PRs" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/commits/main">
    <img src="https://img.shields.io/github/last-commit/GLINCKER/glin-profanity" alt="Last Commit" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/stargazers">
    <img src="https://img.shields.io/github/stars/GLINCKER/glin-profanity" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/network/members">
    <img src="https://img.shields.io/github/forks/GLINCKER/glin-profanity" alt="GitHub Forks" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/GLINCKER/glin-profanity" alt="Contributors" />
  </a>
  <a href="#-table-of-contents">
    <img src="https://img.shields.io/badge/-Table%20of%20Contents-blue" alt="Table Of Contents" />
  </a>
</p>

---


> A multilingual profanity detection and filtering engine for modern applications — by [GLINCKER](https://glincker.com)
 
[![Glin Profanity Preview](./../assets/glin-profanity-preview.png)](https://glincker.com/tools/profanity-checker)

---

## ✨ Overview

**Glin-Profanity** is a high-performance JavaScript/TypeScript library built to detect, filter, and sanitize profane or harmful language in user-generated content. With support for over 20+ languages, configurable severity levels, obfuscation detection, and real-time React integration, it’s designed for developers who care about building safe, inclusive platforms.

Whether you're moderating chat messages, community forums, or content input forms, Glin-Profanity empowers you to:

- 🧼 Filter text with real-time or batch processing
- 🗣️ Detect offensive terms in **20+ human languages**
- 💬 Catch obfuscated profanity like `sh1t`, `f*ck`, `a$$hole`
- 🎚️ Adjust severity thresholds (`Exact`, `Fuzzy`, `Merged`)
- 🔁 Replace bad words with symbols or emojis
- 🧩 Seamlessly integrate into **React apps** via `useProfanityChecker`
- 🛡️ Add custom word lists or ignore specific terms

## 📚 Table of Contents

- [🚀 Features](#-features)
- [📦 Installation](#installation)
- [🌍 Supported Languages](#supported-languages)
- [⚙️ Usage](#usage)
  - [Basic Usage](#basic-usage)
- [🧠 API](#api)
  - [Filter Class](#filter-class)
    - [Constructor](#constructor)
    - [FilterConfig Options](#filterconfig-options)
    - [Methods](#methods)
      - [isProfane](#isprofane)
      - [checkProfanity](#checkprofanity)
  - [useProfanityChecker Hook](#useprofanitychecker-hook)
    - [Parameters](#parameters)
    - [Return Value](#return-value)
- [⚠️ Note](#note)
- [🛠 Use Cases](#-use-cases)
- [📄 License](#license)
  - [MIT License](#mit-license)

## Installation

To install Glin-Profanity, use npm:

```bash
npm install glin-profanity
```
OR

```bash
yarn add glin-profanity
```
 
### Supported Languages

Arabic, Chinese, Czech, Danish, English, Esperanto, Finnish, French, German, Hindi, Hungarian, Italian, Japanese, Korean, Norwegian, Persian, Polish, Portuguese, Russian, Turkish, Swedish, Thai

## Usage

### Basic Usage

Here's a simple example of how to use Glin-Profanity in a React application:

```tsx
import React, { useState } from 'react';
import { useProfanityChecker, SeverityLevel, Language } from 'glin-profanity';

const App = () => {
  const [text, setText] = useState('');
  const [autoReplace, setAutoReplace] = useState(true);
  const [replaceWith, setReplaceWith] = useState('***');
  const [minSeverity, setMinSeverity] = useState(SeverityLevel.Exact);

  const { result, checkText } = useProfanityChecker({
    allLanguages: true,
    severityLevels: true,
    autoReplace,
    replaceWith,
    minSeverity,
    customActions: (res) => {
      console.log('[Detected]', res.profaneWords);
    },
  });

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => checkText(text)}>Scan</button>

      {result && (
        <>
          <p>Contains Profanity: {result.containsProfanity ? 'Yes' : 'No'}</p>
          {result.containsProfanity && (
            <>
              <p>Detected: {result.profaneWords.join(', ')}</p>
              <p>Replaced: {result.processedText}</p>
            </>
          )}
        </>
      )}
    </div>
  );
};
```


## API

### `Filter` Class

#### Constructor

```typescript
new Filter(config?: { 
  languages?: Language[]; 
  allLanguages?: boolean;
  caseSensitive?: boolean;
  wordBoundaries?: boolean;
  customWords?: string[];
  replaceWith?: string;
  severityLevels?: boolean; 
  ignoreWords?: string[];
  logProfanity?: boolean; 
});
```

#### FilterConfig Options:

| Option                  | Type               | Description |
|-------------------------|--------------------|-------------|
| `languages`             | `Language[]`       | Languages to include |
| `allLanguages`          | `boolean`          | If true, scan all available languages |
| `caseSensitive`         | `boolean`          | Match case exactly |
| `wordBoundaries`        | `boolean`          | Only match full words (turn off for substring matching) |
| `customWords`           | `string[]`         | Add your own words |
| `replaceWith`           | `string`           | Replace matched words with this string |
| `severityLevels`        | `boolean`          | Enable severity mapping (Exact, Fuzzy, Merged) |
| `ignoreWords`           | `string[]`         | Words to skip even if found |
| `logProfanity`          | `boolean`          | Log results via console |
| `allowObfuscatedMatch`  | `boolean`          | Enable fuzzy pattern matching like `f*ck` |
| `fuzzyToleranceLevel`   | `number (0–1)`     | Adjust how tolerant fuzzy matching is |
| `autoReplace`           | `boolean`          | Whether to auto-replace flagged words |
| `minSeverity`           | `SeverityLevel`    | Minimum severity to include in final list |
| `customActions`         | `(result) => void` | Custom logging/callback support |

---

#### Methods

##### `isProfane`

Checks if a given text contains profanities.

```typescript
isProfane(value: string): boolean;
```

- `value`: The text to check.
- Returns: `boolean` - `true` if the text contains profanities, `false` otherwise.

##### `checkProfanity`

Returns details about profanities found in the text.

```typescript
checkProfanity(text: string): CheckProfanityResult;
```

- `text`: The text to check.
- Returns: `CheckProfanityResult`
  - `containsProfanity`: `boolean` - `true` if the text contains profanities, `false` otherwise.
  - `profaneWords`: `string[]` - An array of profane words found in the text.
  - `processedText`: `string` - The text with profane words replaced (if `replaceWith` is specified).
  - `severityMap`: `{ [word: string]: number }` - A map of profane words to their severity levels (if `severityLevels` is specified).

### `useProfanityChecker` Hook

A custom React hook for using the profanity checker.

#### Parameters

- `config`: An optional configuration object.
  - `languages`: An array of languages to check for profanities.
  - `allLanguages`: A boolean indicating whether to check for all languages.
  - `caseSensitive`: A boolean indicating whether the profanity check should be case-sensitive.
  - `wordBoundaries`: A boolean indicating whether to consider word boundaries when checking for profanities.
  - `customWords`: An array of custom words to include in the profanity check.
  - `replaceWith`: A string to replace profane words with.
  - `severityLevels`: A boolean indicating whether to include severity levels for profane words. 
  - `ignoreWords`: An array of words to ignore in the profanity check.
  - `logProfanity`: A boolean indicating whether to log detected profane words. 
  - `customActions`: A function to execute custom actions when profanity is detected.

#### Return Value

- `result`: The result of the profanity check.
- `checkText`: A function to check a given text for profanities.
- `checkTextAsync`: A function to check a given text for profanities asynchronously.

```typescript
const { result, checkText, checkTextAsync } = useProfanityChecker(config);
```

## Note 
⚠️ Glin-Profanity is a best-effort tool. Language evolves, and no filter is perfect. Always supplement with human moderation for high-risk platforms.

## 🛠 Use Cases

- 🔐 Chat moderation in messaging apps
- 🧼 Comment sanitization for blogs or forums
- 🕹️ Game lobbies & multiplayer chats
- 🤖 AI content filters before processing input


## License

This software is also available under the GLINCKER LLC proprietary license. The proprietary license allows for use, modification, and distribution of the software with certain restrictions and conditions as set forth by GLINCKER LLC.

You are free to use this software for reference and educational purposes. However, any commercial use, distribution, or modification outside the terms of the MIT License requires explicit permission from GLINCKER LLC. 

By using the software in any form, you agree to adhere to the terms of both the MIT License and the GLINCKER LLC proprietary license, where applicable. If there is any conflict between the terms of the MIT License and the GLINCKER LLC proprietary license, the terms of the GLINCKER LLC proprietary license shall prevail.

### MIT License

GLIN PROFANITY is [MIT licensed](./LICENSE).