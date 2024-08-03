var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState } from 'react';
import { Filter } from '../filters/Filter';
export const useProfanityChecker = (config) => {
    const [result, setResult] = useState(null);
    const filter = new Filter(config);
    const checkText = (text) => {
        const checkResult = filter.checkProfanity(text);
        setResult(checkResult);
        if (config === null || config === void 0 ? void 0 : config.customActions) {
            config.customActions(checkResult);
        }
    };
    const checkTextAsync = (text) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const checkResult = filter.checkProfanity(text);
            setResult(checkResult);
            if (config === null || config === void 0 ? void 0 : config.customActions) {
                config.customActions(checkResult);
            }
            resolve(checkResult);
        });
    });
    return {
        result,
        checkText,
        checkTextAsync,
    };
};
//# sourceMappingURL=useProfanityChecker.js.map