import React, { useState } from 'react';
import { useProfanityChecker } from './hooks/useProfanityChecker';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const { result, checkText } = useProfanityChecker('en');

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
