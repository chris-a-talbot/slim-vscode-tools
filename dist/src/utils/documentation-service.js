"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationService = void 0;
const fs = __importStar(require("fs"));
const paths_1 = require("../config/paths");
const config_1 = require("../config/config");
const logger_1 = require("./logger");
const text_processing_1 = require("./text-processing");
class DocumentationService {
    constructor() {
        this.functionsData = {};
        this.classesData = {};
        this.callbacksData = {};
        this.typesData = {};
        this.operatorsData = {};
        this.classConstructors = {};
        this.loadDocumentation();
    }
    loadDocumentation() {
        try {
            this.loadFunctionData(paths_1.slimFunctionsPath, 'SLiM', this.functionsData);
            (0, logger_1.log)(`Loaded slim functions: ${Object.keys(this.functionsData).length} functions`);
            this.loadFunctionData(paths_1.eidosFunctionsPath, 'Eidos', this.functionsData);
            (0, logger_1.log)(`Loaded eidos functions: ${Object.keys(this.functionsData).length} total functions`);
            this.loadClassData(paths_1.slimClassesPath, this.classesData);
            (0, logger_1.log)(`Loaded slim classes: ${Object.keys(this.classesData).length} classes`);
            this.loadClassData(paths_1.eidosClassesPath, this.classesData);
            (0, logger_1.log)(`Loaded eidos classes: ${Object.keys(this.classesData).length} total classes`);
            this.loadCallbackData(paths_1.slimCallbacksPath, this.callbacksData);
            (0, logger_1.log)(`Loaded slim callbacks: ${Object.keys(this.callbacksData).length} callbacks`);
            const types = this.loadJsonFile(paths_1.eidosTypesPath);
            if (types) {
                Object.assign(this.typesData, types);
                (0, logger_1.log)(`Loaded eidos types: ${Object.keys(this.typesData).length} types`);
            }
            this.loadOperatorData(paths_1.eidosOperatorsPath, this.operatorsData);
            (0, logger_1.log)(`Loaded eidos operators: ${Object.keys(this.operatorsData).length} operators`);
            this.classConstructors = this.extractClassConstructors(this.classesData);
            (0, logger_1.log)('Documentation loaded successfully');
        }
        catch (error) {
            (0, logger_1.logErrorWithStack)(error, 'Error loading documentation');
        }
    }
    getFunctions() {
        return this.functionsData;
    }
    getClasses() {
        return this.classesData;
    }
    getCallbacks() {
        return this.callbacksData;
    }
    getTypes() {
        return this.typesData;
    }
    getOperators() {
        return this.operatorsData;
    }
    getClassConstructors() {
        return this.classConstructors;
    }
    transformFunctionData(_funcName, funcData, _category, source) {
        const signature = funcData.signatures[0];
        const returnTypeMatch = signature.match(config_1.TEXT_PROCESSING_PATTERNS.RETURN_TYPE);
        const returnType = returnTypeMatch ? returnTypeMatch[1] : 'void';
        const signatureWithoutReturnType = signature.replace(/^\([^)]+\)\s*/, '');
        return {
            ...funcData,
            signature: signatureWithoutReturnType,
            returnType,
            source
        };
    }
    transformCallbackData(_callbackName, callbackData) {
        return {
            ...callbackData,
            signature: callbackData.signature.replace(/\s+(callbacks|events)$/, '')
        };
    }
    transformOperatorData(_operatorKey, operatorInfo, normalizedSymbol) {
        return {
            ...operatorInfo,
            signature: operatorInfo.signature || '',
            symbol: normalizedSymbol
        };
    }
    loadJsonFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        }
        catch (error) {
            (0, logger_1.logErrorWithStack)(error, `Error loading ${filePath}`);
            return null;
        }
    }
    loadFunctionData(filePath, source, target) {
        const data = this.loadJsonFile(filePath);
        if (!data)
            return;
        for (const [category, items] of Object.entries(data)) {
            for (const [key, value] of Object.entries(items)) {
                target[key] = this.transformFunctionData(key, value, category, source);
            }
        }
    }
    loadClassData(filePath, target) {
        const data = this.loadJsonFile(filePath);
        if (data) {
            Object.assign(target, data);
        }
    }
    loadCallbackData(filePath, target) {
        const data = this.loadJsonFile(filePath);
        if (!data)
            return;
        for (const [key, value] of Object.entries(data)) {
            target[key] = this.transformCallbackData(key, value);
        }
    }
    loadOperatorData(filePath, target) {
        const data = this.loadJsonFile(filePath);
        if (!data)
            return;
        for (const [key, value] of Object.entries(data)) {
            const signature = value.signature || '';
            const extractedKeys = signature.split(',').map(s => s.trim()).filter(s => s);
            for (const extractedKey of extractedKeys) {
                const normalizedKey = extractedKey.trim().replace(/['"]/g, '');
                if (normalizedKey) {
                    target[normalizedKey] = this.transformOperatorData(key, value, normalizedKey);
                }
            }
        }
    }
    extractClassConstructors(classesData) {
        const classConstructors = {};
        for (const [className, classInfo] of Object.entries(classesData)) {
            const constructorInfo = classInfo.constructor || {};
            const rawSignature = constructorInfo.signature?.trim() || 'None';
            classConstructors[className] = {
                signature: rawSignature !== 'None' ? (0, text_processing_1.cleanSignature)(rawSignature) : 'None',
                description: constructorInfo.description?.trim() || 'No constructor method implemented'
            };
        }
        return classConstructors;
    }
}
exports.DocumentationService = DocumentationService;
//# sourceMappingURL=documentation-service.js.map