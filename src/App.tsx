import React, { useState } from 'react';
import { useProfanityChecker } from 'glin-profanity';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [checkAllLanguages, setCheckAllLanguages] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wordBoundaries, setWordBoundaries] = useState(true);
  const [allowObfuscatedMatch, setAllowObfuscatedMatch] = useState(false);
  const [fuzzyToleranceLevel, setFuzzyToleranceLevel] = useState(0.8);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customWordsText, setCustomWordsText] = useState('[]');
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const { result, checkText, reset } = useProfanityChecker({
    allLanguages: checkAllLanguages,
    caseSensitive: caseSensitive,
    wordBoundaries: wordBoundaries,
    customWords: customWords,
    severityLevels: true,
    allowObfuscatedMatch: allowObfuscatedMatch,
    fuzzyToleranceLevel: fuzzyToleranceLevel,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleCheck = () => {
    checkText(text);
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

      {/* Input Area */}
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type text to check"
        style={{
          padding: '10px',
          fontSize: '16px',
          width: '300px',
          marginBottom: '10px',
        }}
      />
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={handleCheck}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          Check Profanity
        </button>
        <button
          onClick={handleReset}
          style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
        >
          Reset
        </button>
      </div>

      {/* Configuration Section */}
      <div
        style={{
          marginTop: '20px',
          borderTop: '1px solid #ccc',
          paddingTop: '10px',
        }}
      >
        <h3>Configuration</h3>
        <div style={{ marginTop: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={checkAllLanguages}
              onChange={(e) => setCheckAllLanguages(e.target.checked)}
              style={{ marginRight: '10px' }}
            />
            Check All Languages
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              style={{ marginRight: '10px' }}
            />
            Case Sensitive
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={wordBoundaries}
              disabled={allowObfuscatedMatch}
              onChange={(e) => setWordBoundaries(e.target.checked)}
              style={{ marginRight: '10px' }}
            />
            Word Boundaries{' '}
            {allowObfuscatedMatch && (
              <span style={{ color: 'red', marginLeft: '10px' }}>
                (Ignored when obfuscation detection is on)
              </span>
            )}
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={allowObfuscatedMatch}
              onChange={(e) => setAllowObfuscatedMatch(e.target.checked)}
              style={{ marginRight: '10px' }}
            />
            Detect Obfuscated Profanity
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            Fuzzy Tolerance Level: {fuzzyToleranceLevel}
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={fuzzyToleranceLevel}
              onChange={(e) =>
                setFuzzyToleranceLevel(parseFloat(e.target.value))
              }
              style={{ marginLeft: '10px', width: '200px' }}
            />
          </label>
        </div>

        {/* Custom Words JSON Input */}
        <div style={{ marginTop: '10px' }}>
          <label>
            Custom Words (JSON Array):
            <textarea
              value={customWordsText}
              onChange={(e) => setCustomWordsText(e.target.value)}
              placeholder='["badword1", "badword2"]'
              style={{
                display: 'block',
                width: '300px',
                height: '100px',
                marginTop: '10px',
                padding: '10px',
                fontSize: '14px',
              }}
            />
          </label>
          <button
            onClick={applyCustomWords}
            style={{
              padding: '6px 14px',
              fontSize: '14px',
              marginTop: '10px',
              marginLeft: '10px',
            }}
          >
            Apply
          </button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div
          style={{
            marginTop: '20px',
            borderTop: '1px solid #ccc',
            paddingTop: '10px',
          }}
        >
          <h3>Result</h3>
          <p>
            Contains Profanity:{' '}
            <strong>{result.containsProfanity ? 'Yes' : 'No'}</strong>
          </p>
          {result.containsProfanity && (
            <>
              <h4>Profane Words and Severity Levels:</h4>
              <ul>
                {result.profaneWords.map((word, index) => (
                  <li key={index}>
                    {word} - Severity Level:{' '}
                    {result.severityMap?.[word] ?? 'N/A'}
                  </li>
                ))}
              </ul>
              {result.processedText && (
                <div>
                  <h4>Processed Text:</h4>
                  <p>{result.processedText}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
