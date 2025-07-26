import React, { useState } from 'react';
import { SeverityLevel, useProfanityChecker } from 'glin-profanity';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [checkAllLanguages, setCheckAllLanguages] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wordBoundaries, setWordBoundaries] = useState(true);
  const [allowObfuscatedMatch, setAllowObfuscatedMatch] = useState(false);
  const [fuzzyToleranceLevel, setFuzzyToleranceLevel] = useState(0.8);
  const [autoReplace, setAutoReplace] = useState(false);
  const [minSeverity, setMinSeverity] = useState<SeverityLevel>(
    SeverityLevel.Exact,
  );
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customWordsText, setCustomWordsText] = useState('[]');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [replaceWith, setReplaceWith] = useState('***');
  const [checkedOutput, setCheckedOutput] = useState<any>(null);

  const { checkText, reset } = useProfanityChecker({
    allLanguages: checkAllLanguages,
    caseSensitive,
    wordBoundaries,
    customWords,
    severityLevels: true,
    allowObfuscatedMatch,
    fuzzyToleranceLevel,
    minSeverity,
    autoReplace,
    replaceWith, // 🆕 replacement style passed to Filter
    customActions: (res) => {
      const detected = res.profaneWords?.join(', ') || 'none';
      const logMsg = `[Detected]: ${res.containsProfanity ? detected : 'clean'} (total: ${res.profaneWords?.length || 0})`;
      setLogEntries((prev) => [logMsg, ...prev.slice(0, 9)]);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleCheck = () => {
    const output = checkText(text); // extended result
    setCheckedOutput(output);
  };

  const handleReset = () => {
    setText('');
    setCheckAllLanguages(false);
    setCaseSensitive(false);
    setWordBoundaries(true);
    setAllowObfuscatedMatch(false);
    setFuzzyToleranceLevel(0.8);
    setCustomWords([]);
    setCustomWordsText('[]');
    setUploadStatus('');
    reset();
  };

  const applyCustomWords = () => {
    try {
      const parsed = JSON.parse(customWordsText);
      if (Array.isArray(parsed)) {
        setCustomWords(parsed);
        setUploadStatus('✅ Custom words loaded successfully.');
      } else {
        setUploadStatus('❗ Invalid JSON format: Expected an array.');
      }
    } catch (err: any) {
      setUploadStatus('❗ Error parsing JSON: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Glin-Profanity Tool Testing</h1>

      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type text to check"
        style={{
          padding: '10px',
          fontSize: '16px',
          width: '400px',
          marginBottom: '10px',
        }}
      />
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleCheck} style={{ padding: '10px 20px' }}>
          Check Profanity
        </button>
        <button
          onClick={handleReset}
          style={{ padding: '10px 20px', marginLeft: '10px' }}
        >
          Reset
        </button>
      </div>

      {/* Configuration */}
      <div
        style={{
          marginTop: '20px',
          borderTop: '1px solid #ccc',
          paddingTop: '10px',
        }}
      >
        <h3>Configuration</h3>
        <label>
          <input
            type="checkbox"
            checked={checkAllLanguages}
            onChange={(e) => setCheckAllLanguages(e.target.checked)}
          />
          Check All Languages
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Case Sensitive
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={wordBoundaries}
            disabled={allowObfuscatedMatch}
            onChange={(e) => setWordBoundaries(e.target.checked)}
          />
          Word Boundaries
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={allowObfuscatedMatch}
            onChange={(e) => setAllowObfuscatedMatch(e.target.checked)}
          />
          Detect Obfuscated Profanity
        </label>
        <br />
        <label>
          Fuzzy Tolerance: {fuzzyToleranceLevel}
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={fuzzyToleranceLevel}
            onChange={(e) => setFuzzyToleranceLevel(parseFloat(e.target.value))}
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </label>
        <br />
        <label>
          Minimum Severity:
          <select
            value={minSeverity}
            onChange={(e) => setMinSeverity(Number(e.target.value))}
            style={{ marginLeft: '10px' }}
          >
            <option value={SeverityLevel.Exact}>Exact</option>
            <option value={SeverityLevel.Fuzzy}>Fuzzy</option>
            <option value={SeverityLevel.Merged}>Merged</option>
          </select>
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={autoReplace}
            onChange={(e) => setAutoReplace(e.target.checked)}
          />
          Auto Replace Profanity
        </label>

        <div style={{ marginTop: '15px' }}>
          <label>
            Custom Words (JSON):
            <textarea
              value={customWordsText}
              onChange={(e) => setCustomWordsText(e.target.value)}
              placeholder='["badword1", "badword2"]'
              style={{
                display: 'block',
                width: '300px',
                height: '100px',
                marginTop: '10px',
              }}
            />
          </label>
          <button onClick={applyCustomWords} style={{ marginTop: '10px' }}>
            Apply Custom Words
          </button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      </div>

      {/* Result */}
      {checkedOutput && (
        <div
          style={{
            marginTop: '30px',
            borderTop: '1px solid #ccc',
            paddingTop: '10px',
          }}
        >
          <h3>Result</h3>
          <p>
            Contains Profanity:{' '}
            <strong>
              {checkedOutput.containsProfanity ? 'Yes' : 'No'}
            </strong>
          </p>

          {checkedOutput.containsProfanity && (
            <>
              {autoReplace && (
                <div style={{ marginBottom: '10px' }}>
                  <label>
                    Replace With:{' '}
                    <select
                      value={replaceWith}
                      onChange={(e) => setReplaceWith(e.target.value)}
                      style={{ marginLeft: '10px' }}
                    >
                      <option value="***">***</option>
                      <option value="[censored]">[censored]</option>
                      <option value="🧼">🧼</option>
                      <option value="#@%!">#@%!</option>
                    </select>
                  </label>
                </div>
              )}

              <h4>Filtered Profane Words (min severity applied):</h4>
              <ul>
                {checkedOutput.filteredWords?.map(
                  (word: string, index: number) => (
                    <li key={index}>
                      {word} – Severity:{' '}
                      {checkedOutput.severityMap?.[word] ?? 'N/A'}
                    </li>
                  ),
                )}
              </ul>

              {checkedOutput.matchContexts?.length > 0 && (
                <>
                  <h4>Context Matches:</h4>
                  <ul>
                    {checkedOutput.matchContexts.map(
                      (
                        item: { word: string; context: string },
                        index: number,
                      ) => (
                        <li key={index}>
                          <strong>{item.word}</strong>: "…{item.context}…"
                        </li>
                      ),
                    )}
                  </ul>
                </>
              )}

              {autoReplace && checkedOutput.autoReplaced && (
                <>
                  <h4>Auto-Replaced Text:</h4>
                  <p style={{ background: '#f7f7f7', padding: '10px' }}>
                    {checkedOutput.autoReplaced}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Log */}
      {logEntries.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            borderTop: '1px solid #ccc',
            paddingTop: '10px',
          }}
        >
          <h3>Log</h3>
          <ul>
            {logEntries.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
    </div>
  );
};

export default App;
