
# Glin Profanity
Glin-Profanity is a lightweight and efficient npm package designed to detect and filter profane language in text inputs across multiple languages. Whether you’re building a chat application, a comment section, or any platform where user-generated content is involved, Glin-Profanity helps you maintain a clean and respectful environment.

## Installation

To install Glin-Profanity, use npm:

```bash
npm install glin-profanity
```
OR

```bash
yarn add glin-profanity
```
## Usage

### Basic Usage

Here's a simple example of how to use Glin-Profanity in a React application:

```typescript
import React, { useState } from 'react';
import { useProfanityChecker, Language } from 'glin-profanity';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [checkAllLanguages, setCheckAllLanguages] = useState(false);
  const { result, checkText } = useProfanityChecker(
    checkAllLanguages ? { allLanguages: true } : { languages: ['english', 'french'] }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleCheck = () => {
    checkText(text);
  };

  return (
    <div>
      <h1>Welcome to Glin-Profanity</h1>
      <input type="text" value={text} onChange={handleChange} />
      <button onClick={handleCheck}>Check Profanity</button>
      <div>
        <label>
          <input
            type="checkbox"
            checked={checkAllLanguages}
            onChange={(e) => setCheckAllLanguages(e.target.checked)}
          />
          Check All Languages
        </label>
      </div>
      {result && (
        <div>
          <p>Contains Profanity: {result.containsProfanity ? 'Yes' : 'No'}</p>
          {result.containsProfanity && (
            <p>Profane Words: {result.profaneWords.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
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

## License

This software is also available under the GLINCKER LLC proprietary license. The proprietary license allows for use, modification, and distribution of the software with certain restrictions and conditions as set forth by GLINCKER LLC.

You are free to use this software for reference and educational purposes. However, any commercial use, distribution, or modification outside the terms of the MIT License requires explicit permission from GLINCKER LLC. 

By using the software in any form, you agree to adhere to the terms of both the MIT License and the GLINCKER LLC proprietary license, where applicable. If there is any conflict between the terms of the MIT License and the GLINCKER LLC proprietary license, the terms of the GLINCKER LLC proprietary license shall prevail.

### MIT License

GLIN PROFANITY is [MIT licensed](./LICENSE).