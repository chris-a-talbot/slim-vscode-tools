import { FunctionData, ClassInfo, CallbackInfo, TypeInfo, OperatorInfo, ConstructorInfo } from '../types';
export declare class DocumentationService {
    private functionsData;
    private classesData;
    private callbacksData;
    private typesData;
    private operatorsData;
    private classConstructors;
    constructor();
    loadDocumentation(): void;
    getFunctions(): Record<string, FunctionData>;
    getClasses(): Record<string, ClassInfo>;
    getCallbacks(): Record<string, CallbackInfo>;
    getTypes(): Record<string, TypeInfo>;
    getOperators(): Record<string, OperatorInfo>;
    getClassConstructors(): Record<string, ConstructorInfo>;
    private transformFunctionData;
    private transformCallbackData;
    private transformOperatorData;
    private loadJsonFile;
    private loadFunctionData;
    private loadClassData;
    private loadCallbackData;
    private loadOperatorData;
    private extractClassConstructors;
}
//# sourceMappingURL=documentation-service.d.ts.map