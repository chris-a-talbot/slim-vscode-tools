"use strict";
// ============================================================================
// DOCUMENTATION FILE PATHS
// Paths to all documentation JSON files.
// ============================================================================
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
exports.eidosOperatorsPath = exports.eidosTypesPath = exports.slimCallbacksPath = exports.eidosClassesPath = exports.slimClassesPath = exports.eidosFunctionsPath = exports.slimFunctionsPath = void 0;
const path = __importStar(require("path"));
// Calculate extension root: from dist/src/config/ go up 3 levels to project root
const extensionRoot = path.resolve(__dirname, '..', '..', '..');
const slimFunctionsPath = path.join(extensionRoot, 'docs', 'slim_functions.json');
exports.slimFunctionsPath = slimFunctionsPath;
const eidosFunctionsPath = path.join(extensionRoot, 'docs', 'eidos_functions.json');
exports.eidosFunctionsPath = eidosFunctionsPath;
const slimClassesPath = path.join(extensionRoot, 'docs', 'slim_classes.json');
exports.slimClassesPath = slimClassesPath;
const eidosClassesPath = path.join(extensionRoot, 'docs', 'eidos_classes.json');
exports.eidosClassesPath = eidosClassesPath;
const slimCallbacksPath = path.join(extensionRoot, 'docs', 'slim_callbacks.json');
exports.slimCallbacksPath = slimCallbacksPath;
const eidosTypesPath = path.join(extensionRoot, 'docs', 'eidos_types.json');
exports.eidosTypesPath = eidosTypesPath;
const eidosOperatorsPath = path.join(extensionRoot, 'docs', 'eidos_operators.json');
exports.eidosOperatorsPath = eidosOperatorsPath;
//# sourceMappingURL=paths.js.map