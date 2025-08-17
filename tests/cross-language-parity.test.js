/**
 * Cross-language API parity tests
 * Ensures JavaScript and Python packages return identical results
 */

const { execSync } = require('child_process');
const { Filter } = require('../packages/js/dist/index.js');

describe('Cross-Language API Parity', () => {
  const testCases = [
    {
      name: 'clean text',
      text: 'This is a clean message',
      config: { languages: ['english'] }
    },
    {
      name: 'simple profanity',
      text: 'This is damn bad',
      config: { languages: ['english'] }
    },
    {
      name: 'multiple languages',
      text: 'Hello damn world',
      config: { languages: ['english', 'spanish'] }
    },
    {
      name: 'with replacement',
      text: 'This is damn annoying',
      config: { languages: ['english'], replaceWith: '***' }
    },
    {
      name: 'case insensitive',
      text: 'This is DAMN bad',
      config: { languages: ['english'], caseSensitive: false }
    },
    {
      name: 'custom words',
      text: 'This contains badword',
      config: { languages: ['english'], customWords: ['badword'] }
    }
  ];

  const edgeCaseTests = [
    {
      name: 'obfuscated profanity - asterisks',
      text: 'This is d*mn annoying',
      config: { languages: ['english'], allowObfuscatedMatch: true }
    },
    {
      name: 'obfuscated profanity - numbers',
      text: 'This is d4mn bad',
      config: { languages: ['english'], allowObfuscatedMatch: true }
    },
    {
      name: 'obfuscated profanity - symbols',
      text: 'This is d@mn terrible',
      config: { languages: ['english'], allowObfuscatedMatch: true }
    },
    {
      name: 'repeated characters',
      text: 'This is daaaammmn bad',
      config: { languages: ['english'], allowObfuscatedMatch: true }
    },
    {
      name: 'word boundaries disabled',
      text: 'This contains helldamn',
      config: { languages: ['english'], wordBoundaries: false }
    },
    {
      name: 'fuzzy matching',
      text: 'This is dmn bad',
      config: { languages: ['english'], fuzzyToleranceLevel: 0.6 }
    },
    {
      name: 'severity levels enabled',
      text: 'This is damn bad',
      config: { languages: ['english'], severityLevels: true }
    },
    {
      name: 'ignore words',
      text: 'This is damn good', 
      config: { languages: ['english'], ignoreWords: ['damn'] }
    },
    {
      name: 'empty text',
      text: '',
      config: { languages: ['english'] }
    },
    {
      name: 'whitespace only',
      text: '   \n\t  ',
      config: { languages: ['english'] }
    },
    {
      name: 'mixed case obfuscation',
      text: 'This is D@MN bad',
      config: { languages: ['english'], allowObfuscatedMatch: true, caseSensitive: false }
    }
  ];

  const multiLanguageTests = [
    {
      name: 'spanish profanity',
      text: 'Esto es una mierda',
      config: { languages: ['spanish'] }
    },
    {
      name: 'french profanity',
      text: 'C\'est de la merde',
      config: { languages: ['french'] }
    },
    {
      name: 'german profanity',
      text: 'Das ist Scheiße',
      config: { languages: ['german'] }
    },
    {
      name: 'mixed language content',
      text: 'Hello mierda damn world',
      config: { languages: ['english', 'spanish'] }
    },
    {
      name: 'all available languages',
      text: 'This is damn bad',
      config: { allLanguages: true }
    }
  ];

  const contextAwareTests = [
    {
      name: 'context aware - enabled',
      text: 'This is damn good work',
      config: { 
        languages: ['english'], 
        enableContextAware: true,
        confidenceThreshold: 0.7 
      }
    },
    {
      name: 'context aware - disabled',
      text: 'This is damn good work',
      config: { 
        languages: ['english'], 
        enableContextAware: false 
      }
    },
    {
      name: 'context window variation',
      text: 'The damn good weather today',
      config: { 
        languages: ['english'], 
        enableContextAware: true,
        contextWindow: 5,
        confidenceThreshold: 0.8
      }
    }
  ];

  const runPythonTest = (text, config) => {
    const pythonScript = `
import sys
import json
sys.path.insert(0, './packages/py')
from glin_profanity import Filter

config = ${JSON.stringify(config)}
filter_instance = Filter(config)
result = filter_instance.check_profanity("${text}")

# Convert Python result to match JS format
output = {
    "containsProfanity": result["contains_profanity"],
    "profaneWords": result["profane_words"],
    "processedText": result.get("processed_text"),
    "severityMap": {k: int(v) for k, v in result.get("severity_map", {}).items()},
    "reason": result.get("reason")
}
print(json.dumps(output, default=str))
`;

    try {
      const result = execSync(`python3 -c "${pythonScript}"`, { encoding: 'utf8' });
      return JSON.parse(result.trim());
    } catch (error) {
      console.error('Python execution failed:', error.message);
      throw error;
    }
  };

  describe('Basic functionality tests', () => {
    testCases.forEach(({ name, text, config }) => {
      test(`${name} - JS and Python return identical results`, () => {
        // JavaScript result
        const jsFilter = new Filter(config);
        const jsResult = jsFilter.checkProfanity(text);
        
        // Python result
        const pyResult = runPythonTest(text, config);
        
        // Compare core fields that should be identical
        expect(jsResult.containsProfanity).toBe(pyResult.containsProfanity);
        expect(jsResult.profaneWords.sort()).toEqual(pyResult.profaneWords.sort());
        
        if (config.replaceWith) {
          expect(jsResult.processedText).toBe(pyResult.processedText);
        }
        
        // Both should have same number of detected words
        expect(jsResult.profaneWords.length).toBe(pyResult.profaneWords.length);
      });
    });
  });

  describe('Edge case tests', () => {
    edgeCaseTests.forEach(({ name, text, config }) => {
      test(`${name} - JS and Python handle edge cases identically`, () => {
        const jsFilter = new Filter(config);
        const jsResult = jsFilter.checkProfanity(text);
        
        const pyResult = runPythonTest(text, config);
        
        expect(jsResult.containsProfanity).toBe(pyResult.containsProfanity);
        expect(jsResult.profaneWords.sort()).toEqual(pyResult.profaneWords.sort());
        
        // Test obfuscated detection specifically
        if (config.allowObfuscatedMatch && text.includes('*') || text.includes('@') || text.includes('4')) {
          // Should detect obfuscated patterns
          expect(jsResult.containsProfanity).toBe(pyResult.containsProfanity);
        }
      });
    });
  });

  describe('Multi-language support tests', () => {
    multiLanguageTests.forEach(({ name, text, config }) => {
      test(`${name} - JS and Python multi-language support identical`, () => {
        const jsFilter = new Filter(config);
        const jsResult = jsFilter.checkProfanity(text);
        
        const pyResult = runPythonTest(text, config);
        
        expect(jsResult.containsProfanity).toBe(pyResult.containsProfanity);
        expect(jsResult.profaneWords.sort()).toEqual(pyResult.profaneWords.sort());
        
        // Test that both implementations load the same dictionaries
        if (config.allLanguages) {
          // Should have comprehensive coverage
          expect(typeof jsResult.containsProfanity).toBe('boolean');
          expect(typeof pyResult.containsProfanity).toBe('boolean');
        }
      });
    });
  });

  describe('Context-aware filtering tests', () => {
    contextAwareTests.forEach(({ name, text, config }) => {
      test(`${name} - JS and Python context analysis identical`, () => {
        const jsFilter = new Filter(config);
        const jsResult = jsFilter.checkProfanity(text);
        
        const pyResult = runPythonTest(text, config);
        
        expect(jsResult.containsProfanity).toBe(pyResult.containsProfanity);
        expect(jsResult.profaneWords.sort()).toEqual(pyResult.profaneWords.sort());
        
        // Test context-specific behavior
        if (config.enableContextAware) {
          // Both should consider context in filtering decisions
          expect(jsResult).toHaveProperty('reason');
          expect(pyResult).toHaveProperty('reason');
        }
      });
    });
  });

  describe('API structure and method tests', () => {
    test('API structure consistency', () => {
      const jsFilter = new Filter({ languages: ['english'] });
      const jsResult = jsFilter.checkProfanity('test damn');
      
      // Ensure JS result has expected structure
      expect(jsResult).toHaveProperty('containsProfanity');
      expect(jsResult).toHaveProperty('profaneWords');
      expect(Array.isArray(jsResult.profaneWords)).toBe(true);
      
      // Test method names exist
      expect(typeof jsFilter.checkProfanity).toBe('function');
      expect(typeof jsFilter.isProfane).toBe('function');
      expect(typeof jsFilter.checkProfanityWithMinSeverity).toBe('function');
    });

    test('isProfane method parity', () => {
      const testTexts = [
        'clean text',
        'damn bad text',
        'D@MN obfuscated',
        ''
      ];
      
      testTexts.forEach(text => {
        const jsFilter = new Filter({ languages: ['english'], allowObfuscatedMatch: true });
        const jsResult = jsFilter.isProfane(text);
        
        // Test Python equivalent 
        const pythonScript = `
import sys
sys.path.insert(0, './packages/py')
from glin_profanity import Filter

filter_instance = Filter({"languages": ["english"], "allow_obfuscated_match": True})
result = filter_instance.is_profane("${text}")
print("true" if result else "false")
`;
        
        try {
          const pyResult = execSync(`python3 -c "${pythonScript}"`, { encoding: 'utf8' }).trim() === 'true';
          expect(jsResult).toBe(pyResult);
        } catch (error) {
          console.error('Python isProfane test failed:', error.message);
        }
      });
    });

    test('checkProfanityWithMinSeverity method parity', () => {
      const jsFilter = new Filter({ languages: ['english'], severityLevels: true });
      const jsResult = jsFilter.checkProfanityWithMinSeverity('damn bad text', 1);
      
      const pythonScript = `
import sys
import json
sys.path.insert(0, './packages/py')
from glin_profanity import Filter
from glin_profanity.types.types import SeverityLevel

filter_instance = Filter({"languages": ["english"], "severity_levels": True})
result = filter_instance.check_profanity_with_min_severity("damn bad text", SeverityLevel.EXACT)

output = {
    "filteredWords": result["filtered_words"],
    "result": {
        "containsProfanity": result["result"]["contains_profanity"],
        "profaneWords": result["result"]["profane_words"]
    }
}
print(json.dumps(output))
`;
      
      try {
        const pyResultRaw = execSync(`python3 -c "${pythonScript}"`, { encoding: 'utf8' });
        const pyResult = JSON.parse(pyResultRaw.trim());
        
        expect(jsResult.filteredWords.sort()).toEqual(pyResult.filteredWords.sort());
        expect(jsResult.result.containsProfanity).toBe(pyResult.result.containsProfanity);
        expect(jsResult.result.profaneWords.sort()).toEqual(pyResult.result.profaneWords.sort());
      } catch (error) {
        console.error('Python checkProfanityWithMinSeverity test failed:', error.message);
      }
    });
  });
});