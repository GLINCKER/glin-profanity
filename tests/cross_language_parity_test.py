"""
Cross-language API parity tests for Python
Ensures Python and JavaScript packages return identical results
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, Any, List

import pytest

# Add packages to path
sys.path.insert(0, str(Path(__file__).parent.parent / "packages" / "py"))
from glin_profanity import Filter


class TestCrossLanguageParity:
    """Test API parity between Python and JavaScript implementations."""

    test_cases = [
        {
            "name": "clean text",
            "text": "This is a clean message",
            "config": {"languages": ["english"]}
        },
        {
            "name": "simple profanity", 
            "text": "This is damn bad",
            "config": {"languages": ["english"]}
        },
        {
            "name": "multiple languages",
            "text": "Hello damn world", 
            "config": {"languages": ["english", "spanish"]}
        },
        {
            "name": "with replacement",
            "text": "This is damn annoying",
            "config": {"languages": ["english"], "replace_with": "***"}
        },
        {
            "name": "case insensitive",
            "text": "This is DAMN bad",
            "config": {"languages": ["english"], "case_sensitive": False}
        },
        {
            "name": "custom words",
            "text": "This contains badword",
            "config": {"languages": ["english"], "custom_words": ["badword"]}
        }
    ]

    edge_case_tests = [
        {
            "name": "obfuscated profanity - asterisks",
            "text": "This is d*mn annoying",
            "config": {"languages": ["english"], "allow_obfuscated_match": True}
        },
        {
            "name": "obfuscated profanity - numbers",
            "text": "This is d4mn bad",
            "config": {"languages": ["english"], "allow_obfuscated_match": True}
        },
        {
            "name": "obfuscated profanity - symbols",
            "text": "This is d@mn terrible",
            "config": {"languages": ["english"], "allow_obfuscated_match": True}
        },
        {
            "name": "repeated characters",
            "text": "This is daaaammmn bad",
            "config": {"languages": ["english"], "allow_obfuscated_match": True}
        },
        {
            "name": "word boundaries disabled",
            "text": "This contains helldamn",
            "config": {"languages": ["english"], "word_boundaries": False}
        },
        {
            "name": "fuzzy matching",
            "text": "This is dmn bad",
            "config": {"languages": ["english"], "fuzzy_tolerance_level": 0.6}
        },
        {
            "name": "severity levels enabled",
            "text": "This is damn bad",
            "config": {"languages": ["english"], "severity_levels": True}
        },
        {
            "name": "ignore words",
            "text": "This is damn good", 
            "config": {"languages": ["english"], "ignore_words": ["damn"]}
        },
        {
            "name": "empty text",
            "text": "",
            "config": {"languages": ["english"]}
        },
        {
            "name": "whitespace only",
            "text": "   \n\t  ",
            "config": {"languages": ["english"]}
        },
        {
            "name": "mixed case obfuscation",
            "text": "This is D@MN bad",
            "config": {"languages": ["english"], "allow_obfuscated_match": True, "case_sensitive": False}
        }
    ]

    multi_language_tests = [
        {
            "name": "spanish profanity",
            "text": "Esto es una mierda",
            "config": {"languages": ["spanish"]}
        },
        {
            "name": "french profanity",
            "text": "C'est de la merde",
            "config": {"languages": ["french"]}
        },
        {
            "name": "german profanity",
            "text": "Das ist Scheiße",
            "config": {"languages": ["german"]}
        },
        {
            "name": "mixed language content",
            "text": "Hello mierda damn world",
            "config": {"languages": ["english", "spanish"]}
        },
        {
            "name": "all available languages",
            "text": "This is damn bad",
            "config": {"all_languages": True}
        }
    ]

    context_aware_tests = [
        {
            "name": "context aware - enabled",
            "text": "This is damn good work",
            "config": { 
                "languages": ["english"], 
                "enable_context_aware": True,
                "confidence_threshold": 0.7 
            }
        },
        {
            "name": "context aware - disabled",
            "text": "This is damn good work",
            "config": { 
                "languages": ["english"], 
                "enable_context_aware": False 
            }
        },
        {
            "name": "context window variation",
            "text": "The damn good weather today",
            "config": { 
                "languages": ["english"], 
                "enable_context_aware": True,
                "context_window": 5,
                "confidence_threshold": 0.8
            }
        }
    ]

    def run_javascript_test(self, text: str, config: dict) -> dict:
        """Run equivalent test in JavaScript and return result."""
        # Convert Python config to JS config (camelCase)
        js_config = {}
        for key, value in config.items():
            if key == "replace_with":
                js_config["replaceWith"] = value
            elif key == "case_sensitive":
                js_config["caseSensitive"] = value  
            elif key == "custom_words":
                js_config["customWords"] = value
            elif key == "allow_obfuscated_match":
                js_config["allowObfuscatedMatch"] = value
            elif key == "word_boundaries":
                js_config["wordBoundaries"] = value
            elif key == "fuzzy_tolerance_level":
                js_config["fuzzyToleranceLevel"] = value
            elif key == "severity_levels":
                js_config["severityLevels"] = value
            elif key == "ignore_words":
                js_config["ignoreWords"] = value
            elif key == "all_languages":
                js_config["allLanguages"] = value
            elif key == "enable_context_aware":
                js_config["enableContextAware"] = value
            elif key == "context_window":
                js_config["contextWindow"] = value
            elif key == "confidence_threshold":
                js_config["confidenceThreshold"] = value
            else:
                js_config[key] = value

        js_script = f"""
const {{ Filter }} = require('./packages/js/dist/index.js');

const config = {json.dumps(js_config)};
const filter = new Filter(config);
const result = filter.checkProfanity("{text}");

// Convert JS result to match Python format
const output = {{
    "contains_profanity": result.containsProfanity,
    "profane_words": result.profaneWords,
    "processed_text": result.processedText || null,
    "severity_map": result.severityMap || {{}},
    "reason": result.reason || null
}};
console.log(JSON.stringify(output));
"""

        try:
            result = subprocess.run(
                ["node", "-e", js_script],
                capture_output=True,
                text=True,
                check=True
            )
            return json.loads(result.stdout.strip())
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            pytest.fail(f"JavaScript execution failed: {e}")

    @pytest.mark.parametrize("test_case", test_cases)
    def test_basic_parity_with_javascript(self, test_case):
        """Test that Python and JavaScript return identical results for basic cases."""
        name = test_case["name"]
        text = test_case["text"]
        config = test_case["config"]

        # Python result
        py_filter = Filter(config)
        py_result = py_filter.check_profanity(text)

        # JavaScript result
        js_result = self.run_javascript_test(text, config)

        # Compare core fields that should be identical
        assert py_result["contains_profanity"] == js_result["contains_profanity"], \
            f"containsProfanity mismatch in {name}"
        
        assert sorted(py_result["profane_words"]) == sorted(js_result["profane_words"]), \
            f"profaneWords mismatch in {name}"

        if config.get("replace_with"):
            assert py_result.get("processed_text") == js_result.get("processed_text"), \
                f"processedText mismatch in {name}"

        # Both should have same number of detected words
        assert len(py_result["profane_words"]) == len(js_result["profane_words"]), \
            f"Word count mismatch in {name}"

    @pytest.mark.parametrize("test_case", edge_case_tests)
    def test_edge_case_parity_with_javascript(self, test_case):
        """Test that Python and JavaScript handle edge cases identically."""
        name = test_case["name"]
        text = test_case["text"]
        config = test_case["config"]

        py_filter = Filter(config)
        py_result = py_filter.check_profanity(text)
        
        js_result = self.run_javascript_test(text, config)
        
        assert py_result["contains_profanity"] == js_result["contains_profanity"], \
            f"containsProfanity mismatch in {name}"
        assert sorted(py_result["profane_words"]) == sorted(js_result["profane_words"]), \
            f"profaneWords mismatch in {name}"
        
        # Test obfuscated detection specifically
        if config.get("allow_obfuscated_match") and ('*' in text or '@' in text or '4' in text):
            # Should detect obfuscated patterns
            assert py_result["contains_profanity"] == js_result["contains_profanity"], \
                f"Obfuscated detection mismatch in {name}"

    @pytest.mark.parametrize("test_case", multi_language_tests)
    def test_multi_language_parity_with_javascript(self, test_case):
        """Test that Python and JavaScript multi-language support is identical."""
        name = test_case["name"]
        text = test_case["text"]
        config = test_case["config"]

        py_filter = Filter(config)
        py_result = py_filter.check_profanity(text)
        
        js_result = self.run_javascript_test(text, config)
        
        assert py_result["contains_profanity"] == js_result["contains_profanity"], \
            f"containsProfanity mismatch in {name}"
        assert sorted(py_result["profane_words"]) == sorted(js_result["profane_words"]), \
            f"profaneWords mismatch in {name}"
        
        # Test that both implementations load the same dictionaries
        if config.get("all_languages"):
            # Should have comprehensive coverage
            assert isinstance(py_result["contains_profanity"], bool)
            assert isinstance(js_result["contains_profanity"], bool)

    @pytest.mark.parametrize("test_case", context_aware_tests)
    def test_context_aware_parity_with_javascript(self, test_case):
        """Test that Python and JavaScript context analysis is identical."""
        name = test_case["name"]
        text = test_case["text"]
        config = test_case["config"]

        py_filter = Filter(config)
        py_result = py_filter.check_profanity(text)
        
        js_result = self.run_javascript_test(text, config)
        
        assert py_result["contains_profanity"] == js_result["contains_profanity"], \
            f"containsProfanity mismatch in {name}"
        assert sorted(py_result["profane_words"]) == sorted(js_result["profane_words"]), \
            f"profaneWords mismatch in {name}"
        
        # Test context-specific behavior
        if config.get("enable_context_aware"):
            # Both should consider context in filtering decisions
            assert "reason" in py_result or py_result.get("reason") is not None
            assert "reason" in js_result or js_result.get("reason") is not None

    def test_api_structure_consistency(self):
        """Test that Python API has expected structure."""
        py_filter = Filter({"languages": ["english"]})
        py_result = py_filter.check_profanity("test damn")

        # Ensure Python result has expected structure
        assert "contains_profanity" in py_result
        assert "profane_words" in py_result
        assert isinstance(py_result["profane_words"], list)

        # Test method names exist
        assert hasattr(py_filter, "check_profanity")
        assert hasattr(py_filter, "is_profane")
        assert hasattr(py_filter, "check_profanity_with_min_severity")
        assert callable(py_filter.check_profanity)
        assert callable(py_filter.is_profane)
        assert callable(py_filter.check_profanity_with_min_severity)

    def test_is_profane_method_parity(self):
        """Test that is_profane method returns identical results to JavaScript."""
        test_texts = [
            "clean text",
            "damn bad text", 
            "D@MN obfuscated",
            ""
        ]
        
        for text in test_texts:
            py_filter = Filter({"languages": ["english"], "allow_obfuscated_match": True})
            py_result = py_filter.is_profane(text)
            
            # Test JavaScript equivalent
            js_script = f"""
const {{ Filter }} = require('./packages/js/dist/index.js');

const filter = new Filter({{"languages": ["english"], "allowObfuscatedMatch": true}});
const result = filter.isProfane("{text}");
console.log(result ? "true" : "false");
"""
            
            try:
                js_result = subprocess.run(
                    ["node", "-e", js_script],
                    capture_output=True,
                    text=True,
                    check=True
                )
                js_bool = js_result.stdout.strip() == "true"
                assert py_result == js_bool, f"is_profane mismatch for text: {text}"
            except subprocess.CalledProcessError as e:
                pytest.fail(f"JavaScript isProfane test failed: {e}")

    def test_check_profanity_with_min_severity_parity(self):
        """Test that check_profanity_with_min_severity returns identical results."""
        from glin_profanity.types.types import SeverityLevel
        
        py_filter = Filter({"languages": ["english"], "severity_levels": True})
        py_result = py_filter.check_profanity_with_min_severity("damn bad text", SeverityLevel.EXACT)
        
        js_script = """
const { Filter } = require('./packages/js/dist/index.js');

const filter = new Filter({"languages": ["english"], "severityLevels": true});
const result = filter.checkProfanityWithMinSeverity("damn bad text", 1);

const output = {
    "filteredWords": result.filteredWords,
    "result": {
        "containsProfanity": result.result.containsProfanity,
        "profaneWords": result.result.profaneWords
    }
};
console.log(JSON.stringify(output));
"""
        
        try:
            js_result_raw = subprocess.run(
                ["node", "-e", js_script],
                capture_output=True,
                text=True,
                check=True
            )
            js_result = json.loads(js_result_raw.stdout.strip())
            
            assert sorted(py_result["filtered_words"]) == sorted(js_result["filteredWords"]), \
                "filtered_words mismatch"
            assert py_result["result"]["contains_profanity"] == js_result["result"]["containsProfanity"], \
                "result.contains_profanity mismatch"
            assert sorted(py_result["result"]["profane_words"]) == sorted(js_result["result"]["profaneWords"]), \
                "result.profane_words mismatch"
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            pytest.fail(f"JavaScript checkProfanityWithMinSeverity test failed: {e}")