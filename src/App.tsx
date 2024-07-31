import React, { useState } from 'react';
import { useProfanityChecker } from './hooks/useProfanityChecker';

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
