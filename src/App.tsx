import React, { useState } from 'react';
import { useProfanityChecker } from 'glin-profanity';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [checkAllLanguages, setCheckAllLanguages] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wordBoundaries, setWordBoundaries] = useState(true);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const { result, checkText } = useProfanityChecker({
    allLanguages: checkAllLanguages,
    caseSensitive: caseSensitive,
    wordBoundaries: wordBoundaries,
    customWords: customWords,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleCheck = () => {
    checkText(text);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const words = JSON.parse(event.target?.result as string);
          if (Array.isArray(words)) {
            setCustomWords(words);
            setUploadStatus('Custom words loaded successfully.');
          } else {
            setUploadStatus('Invalid JSON format: expected an array of strings.');
          }
        } catch (error) {
          setUploadStatus('Error parsing JSON: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    setText('');
    setCheckAllLanguages(false);
    setCaseSensitive(false);
    setWordBoundaries(true);
    setCustomWords([]);
    setUploadStatus('');
  };

  return (
    <div>
      <h1>Welcome to Glin-Profanity Tool Testing</h1>
      <input 
        type="text" 
        value={text} 
        onChange={handleChange} 
        placeholder="Type text to check"
        style={{ padding: '10px', fontSize: '16px', width: '300px', marginBottom: '10px' }}
      />
      <button onClick={handleCheck} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Check Profanity
      </button>
      <button onClick={handleReset} style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}>
        Reset
      </button>
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
            onChange={(e) => setWordBoundaries(e.target.checked)}
            style={{ marginRight: '10px' }}
          />
          Word Boundaries
        </label>
      </div>
      <div style={{ marginTop: '10px' }}>
        <label>
          Upload Custom Words JSON:
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ marginLeft: '10px' }}
          />
        </label>
        {uploadStatus && <p>{uploadStatus}</p>}
      </div>
      {customWords.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h3>Custom Words:</h3>
          <ul>
            {customWords.map((word, index) => (
              <li key={index}>{word}</li>
            ))}
          </ul>
        </div>
      )}
      {result && (
        <div style={{ marginTop: '20px' }}>
          <p>Contains Profanity: <strong>{result.containsProfanity ? 'Yes' : 'No'}</strong></p>
          {result.containsProfanity && (
            <>
              <h3>Profane Words and Severity Levels:</h3>  
<ul>
  {result.profaneWords.map((word, index) => (
    <li key={index}>
      {word} - Severity Level: {result.severityMap ? result.severityMap[word] : result.severityMap[word]}
    </li>
  ))}
</ul>
{result.processedText && (
  <div>
    <h3>Processed Text:</h3>
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
