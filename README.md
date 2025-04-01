
# 🔥 Glin-Profanity

Glin-Profanity is a modern, lightweight, and multilingual profanity filtering package built for **React**, **JavaScript/TypeScript** projects, and any Node.js application.
It now supports detection of **obfuscated, fuzzy, merged, and chat-style profanities**.

---

## 🚀 Features

- ✅ **Multi-language profanity detection**
- ✅ **Highly customizable configuration**
- ✅ **Word boundary detection**
- ✅ **Obfuscated profanity detection** (`f*ck`, `fuuuuck`, `shiiiit` → detected)
- ✅ **Fuzzy matching with tolerance control**
- ✅ **Common slangs, abbreviations & modern profanities**
- ✅ **Custom word dictionary support**
- ✅ **React Hook & Filter class APIs**
- ✅ **Severity levels for detected words**
- ✅ **Whitelist override & custom callbacks**
- ✅ **Lightweight & fast**

---

## 📥 Installation

Using NPM:
```bash
npm install glin-profanity
```

Using Yarn:
```bash
yarn add glin-profanity
```

---

## ⚙️ Usage

### Basic React Hook Example

```tsx
import React, { useState } from 'react';
import { useProfanityChecker } from 'glin-profanity';

const App = () => {
  const [text, setText] = useState('');
  const { result, checkText } = useProfanityChecker({
    languages: ['english'],
    severityLevels: true,
  });

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => checkText(text)}>Check</button>
      {result && (
        <p>{result.containsProfanity ? 'Profanity Detected' : 'Clean'}</p>
      )}
    </div>
  );
};
```

---

### Advanced Options

```ts
const { result, checkText } = useProfanityChecker({
  allLanguages: true,
  allowObfuscatedMatch: true,
  fuzzyToleranceLevel: 0.7,
  wordBoundaries: false,
  severityLevels: true,
  customWords: ['foo', 'bar'],
  replaceWith: '****',
  logProfanity: true,
});
```

---

## 🧩 API Reference

### `useProfanityChecker(config)`

| Option                  | Type           | Description                                                   |
|------------------------|---------------|---------------------------------------------------------------|
| `languages`            | `Language[]`  | Array of languages to check                                   |
| `allLanguages`        | `boolean`     | Check all supported languages                                 |
| `caseSensitive`      | `boolean`     | Enable case-sensitive matching                                |
| `wordBoundaries`    | `boolean`     | Match full words only                                         |
| `allowObfuscatedMatch` | `boolean`   | Detect obfuscated profanities (e.g. `f*ck`, `fuuuuck`)        |
| `fuzzyToleranceLevel` | `number`      | Fuzzy match tolerance (0.5 - 1)                               |
| `customWords`        | `string[]`    | Add your own profane words                                    |
| `replaceWith`        | `string`      | Replace profane words with this string                        |
| `severityLevels`    | `boolean`     | Include severity scores (Exact, Fuzzy, Merged)                |
| `ignoreWords`      | `string[]`    | Whitelisted words to ignore                                   |
| `logProfanity`     | `boolean`     | Enable logging of detected profanities                        |
| `customActions`    | `(result) => void` | Callback after detection                                  |

---

## 🎯 Severity Levels

Each detected word will have an optional severity score:
| Level | Meaning             |
|------:|:--------------------|
|   1  | Exact Match         |
|   2  | Fuzzy Match         |
|   3  | Merged/Obfuscated   |

---

## 🗂️ Dictionary

Glin-Profanity includes an optimized, cleaned profanity list:
- Base words
- Derivatives like `fucker`, `motherfucker`
- Modern slangs (`simp`, `hoe`, `wtf`)
- Obfuscated forms (`f*ck`, `a$$`, `sh!t`)
- Racist, sexual, abusive, and derogatory terms

You can override or extend this list using `customWords`.

---

## 🔗 License

This software is dual-licensed:

- MIT License ([See License](./LICENSE))
- GLINCKER LLC Proprietary License (For Commercial Use)

You are free to use this library under MIT for non-commercial or educational purposes.
For commercial use and distribution, please refer to the proprietary license terms of **GLINCKER LLC**.

---

## 🙌 Credits

Maintained by **GLINCKER LLC** | [glincker.com](https://glincker.com)

---
