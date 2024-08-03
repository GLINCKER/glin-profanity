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
        this.words = new Map(words.map(word => [word, 1])); // Default severity level is 1
    }
    getRegex(word) {
        const flags = this.caseSensitive ? 'g' : 'gi';
        const boundary = this.wordBoundaries ? '\\b' : '';
        return new RegExp(`${boundary}${word.replace(/(\W)/g, '\\$1')}${boundary}`, flags);
    }
    isProfane(value) {
        for (const word of this.words.keys()) {
            if (!this.ignoreWords.has(word.toLowerCase()) && this.getRegex(word).test(value))
                return true;
        }
        return false;
    }
    checkProfanity(text) {
        const words = text.split(/\s+/);
        const profaneWords = [];
        const severityMap = {};
        for (const word of words) {
            if (this.words.has(word.toLowerCase()) && !this.ignoreWords.has(word.toLowerCase())) {
                profaneWords.push(word);
                severityMap[word] = this.words.get(word.toLowerCase());
            }
        }
        if (this.logProfanity && profaneWords.length > 0) {
            console.log(`Profane words detected: ${profaneWords.join(', ')}`);
        }
        let processedText = text;
        if (this.replaceWith) {
            for (const word of profaneWords) {
                processedText = processedText.replace(this.getRegex(word), this.replaceWith);
            }
        }
        return {
            containsProfanity: profaneWords.length > 0,
            profaneWords,
            processedText: this.replaceWith ? processedText : undefined,
            severityMap: this.severityLevels ? severityMap : undefined,
        };
    }
}
export { Filter };
//# sourceMappingURL=Filter.js.map