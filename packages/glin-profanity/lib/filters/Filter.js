import dictionary from '../data/dictionary';
class Filter {
    constructor(config) {
        var _a, _b, _c, _d, _e;
        let words = [];
        this.caseSensitive = (_a = config === null || config === void 0 ? void 0 : config.caseSensitive) !== null && _a !== void 0 ? _a : false;
        this.wordBoundaries = (_b = config === null || config === void 0 ? void 0 : config.wordBoundaries) !== null && _b !== void 0 ? _b : true;
        this.replaceWith = config === null || config === void 0 ? void 0 : config.replaceWith;
        this.severityLevels = (_c = config === null || config === void 0 ? void 0 : config.severityLevels) !== null && _c !== void 0 ? _c : false;
        this.ignoreWords = new Set(((_d = config === null || config === void 0 ? void 0 : config.ignoreWords) === null || _d === void 0 ? void 0 : _d.map(word => word.toLowerCase())) || []);
        this.logProfanity = (_e = config === null || config === void 0 ? void 0 : config.logProfanity) !== null && _e !== void 0 ? _e : false;
        if (config === null || config === void 0 ? void 0 : config.allLanguages) {
            for (const lang in dictionary) {
                if (dictionary.hasOwnProperty(lang)) {
                    words = [...words, ...dictionary[lang]];
                }
            }
        }
        else {
            const languages = (config === null || config === void 0 ? void 0 : config.languages) || ['english'];
            const languagesChecks = new Set(languages);
            if (languagesChecks.size !== 0) {
                languagesChecks.forEach(lang => {
                    words = [...words, ...dictionary[lang]];
                });
            }
        }
        if (config === null || config === void 0 ? void 0 : config.customWords) {
            words = [...words, ...config.customWords];
        }
        this.words = new Map(words.map(word => [word.toLowerCase(), 1])); // Store words in lowercase
    }
    getRegex(word) {
        const flags = this.caseSensitive ? 'g' : 'gi';
        const boundary = this.wordBoundaries ? '\\b' : '';
        return new RegExp(`${boundary}${word.replace(/(\W)/g, '\\$1')}${boundary}`, flags);
    }
    isFuzzyMatch(word, text) {
        const pattern = `${word.split('').join('[^a-zA-Z]*')}`;
        const regex = new RegExp(pattern, this.caseSensitive ? 'g' : 'gi');
        return regex.test(text);
    }
    isMergedMatch(word, text) {
        const pattern = `${word}`;
        const regex = new RegExp(pattern, this.caseSensitive ? 'g' : 'gi');
        return regex.test(text);
    }
    evaluateSeverity(word, text) {
        if (this.getRegex(word).test(text)) {
            return 1; // Exact match
        }
        else if (this.isFuzzyMatch(word, text)) {
            return 2; // Fuzzy match
        }
        else if (this.isMergedMatch(word, text)) {
            return 3; // Merged word match
        }
        return undefined; // No match or irrelevant match
    }
    isProfane(value) {
        for (const word of this.words.keys()) {
            if (!this.ignoreWords.has(word.toLowerCase()) && this.evaluateSeverity(word, value) !== undefined)
                return true;
        }
        return false;
    }
    checkProfanityInSentence(text) {
        const words = text.split(/\s+/);
        const profaneWords = [];
        const severityMap = {};
        for (const word of words) {
            for (const dictWord of this.words.keys()) {
                const severity = this.evaluateSeverity(dictWord, word);
                if (severity !== undefined && !this.ignoreWords.has(dictWord.toLowerCase())) {
                    profaneWords.push(word);
                    severityMap[word] = severity; // Use the actual word found in text as the key
                }
            }
        }
        let processedText = text;
        if (this.replaceWith) {
            for (const word of profaneWords) {
                processedText = processedText.replace(new RegExp(word, 'gi'), this.replaceWith);
            }
        }
        return {
            containsProfanity: profaneWords.length > 0,
            profaneWords,
            processedText: this.replaceWith ? processedText : undefined,
            severityMap: Object.keys(severityMap).length > 0 ? severityMap : undefined, // Only return if there are valid severities
        };
    }
    checkProfanity(text) {
        const words = text.split(/\s+/);
        const profaneWords = [];
        const severityMap = {};
        // Check each word individually
        for (const word of words) {
            for (const dictWord of this.words.keys()) {
                const severity = this.evaluateSeverity(dictWord, word);
                if (severity !== undefined && !this.ignoreWords.has(dictWord.toLowerCase())) {
                    profaneWords.push(word);
                    severityMap[word] = severity; // Use the actual word found in text as the key
                }
            }
        }
        const sentenceResult = this.checkProfanityInSentence(text);
        profaneWords.push(...sentenceResult.profaneWords);
        Object.assign(severityMap, sentenceResult.severityMap);
        let processedText = text;
        if (this.replaceWith) {
            for (const word of profaneWords) {
                processedText = processedText.replace(new RegExp(word, 'gi'), this.replaceWith);
            }
        }
        return {
            containsProfanity: profaneWords.length > 0,
            profaneWords: Array.from(new Set(profaneWords)),
            processedText: this.replaceWith ? processedText : undefined,
            severityMap: Object.keys(severityMap).length > 0 ? severityMap : undefined,
        };
    }
}
export { Filter };
//# sourceMappingURL=Filter.js.map