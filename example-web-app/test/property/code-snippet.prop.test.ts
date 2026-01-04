/**
 * Property Tests: Code Snippet Completeness
 * 
 * Feature: sdk-demo-rework
 * 
 * Tests the correctness properties for code snippets:
 * - Property 8: Code Snippet Completeness
 * 
 * **Validates: Requirements 10.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Import code snippets from hooks
import { USE_RWA_CLIENT_CODE } from '../../src/hooks/use-rwa-client';
import { TOKEN_CODE_SNIPPETS } from '../../src/hooks/use-token';
import { KYC_CODE_SNIPPETS } from '../../src/hooks/use-kyc';
import { YIELD_CODE_SNIPPETS } from '../../src/hooks/use-yield';
import { COMPLIANCE_CODE_SNIPPETS } from '../../src/hooks/use-compliance';
import { EVENTS_CODE_SNIPPETS } from '../../src/hooks/use-events';

/**
 * All code snippets organized by module
 */
const ALL_SNIPPETS = {
    client: { init: USE_RWA_CLIENT_CODE },
    token: TOKEN_CODE_SNIPPETS,
    kyc: KYC_CODE_SNIPPETS,
    yield: YIELD_CODE_SNIPPETS,
    compliance: COMPLIANCE_CODE_SNIPPETS,
    events: EVENTS_CODE_SNIPPETS,
};

/**
 * Required patterns that should be present in code snippets
 */
const REQUIRED_PATTERNS = {
    hasImportOrClient: /(import|client|const|await)/,
    hasMethodCall: /\.\w+\(/,
    hasComment: /\/\//,
};

describe('Property 8: Code Snippet Completeness', () => {
    /**
     * Feature: sdk-demo-rework, Property 8: Code Snippet Completeness
     * 
     * *For any* code snippet displayed in the demo, the snippet SHALL include
     * necessary import statements and be directly copyable and functional.
     */
    it('should have non-empty code snippets for all modules', () => {
        Object.entries(ALL_SNIPPETS).forEach(([moduleName, snippets]) => {
            Object.entries(snippets).forEach(([snippetName, code]) => {
                expect(code, `${moduleName}.${snippetName} should not be empty`).toBeTruthy();
                expect(typeof code, `${moduleName}.${snippetName} should be a string`).toBe('string');
                expect(code.length, `${moduleName}.${snippetName} should have content`).toBeGreaterThan(10);
            });
        });
    });

    it('should contain method calls or variable declarations', () => {
        Object.entries(ALL_SNIPPETS).forEach(([moduleName, snippets]) => {
            Object.entries(snippets).forEach(([snippetName, code]) => {
                const hasMethodCall = REQUIRED_PATTERNS.hasMethodCall.test(code);
                const hasDeclaration = /const|let|var|function/.test(code);

                expect(
                    hasMethodCall || hasDeclaration,
                    `${moduleName}.${snippetName} should contain method calls or declarations`
                ).toBe(true);
            });
        });
    });

    it('should include explanatory comments', () => {
        Object.entries(ALL_SNIPPETS).forEach(([moduleName, snippets]) => {
            Object.entries(snippets).forEach(([snippetName, code]) => {
                expect(
                    REQUIRED_PATTERNS.hasComment.test(code),
                    `${moduleName}.${snippetName} should include comments`
                ).toBe(true);
            });
        });
    });

    it('should have consistent formatting (no leading/trailing whitespace issues)', () => {
        Object.entries(ALL_SNIPPETS).forEach(([moduleName, snippets]) => {
            Object.entries(snippets).forEach(([snippetName, code]) => {
                // Should not have excessive leading whitespace on first line
                const firstLine = code.split('\n')[0];
                expect(
                    firstLine.startsWith('    ') === false || firstLine.startsWith('//'),
                    `${moduleName}.${snippetName} should not have excessive leading whitespace`
                ).toBe(true);
            });
        });
    });
});

describe('Property: Code Snippet Syntax Validity', () => {
    /**
     * Code snippets should have balanced brackets and quotes
     */
    it('should have balanced parentheses', () => {
        Object.entries(ALL_SNIPPETS).forEach(([moduleName, snippets]) => {
            Object.entries(snippets).forEach(([snippetName, code]) => {
                const openParens = (code.match(/\(/g) || []).length;
                const closeParens = (code.match(/\)/g) || []).length;

                expect(
                    openParens,
                    `${moduleName}.${snippetName} should have balanced parentheses`
                ).toBe(closeParens);
            });
        });
    });

    it('should have balanced curly braces', () => {
        Object.entries(ALL_SNIPPETS).forEach(([moduleName, snippets]) => {
            Object.entries(snippets).forEach(([snippetName, code]) => {
                const openBraces = (code.match(/\{/g) || []).length;
                const closeBraces = (code.match(/\}/g) || []).length;

                expect(
                    openBraces,
                    `${moduleName}.${snippetName} should have balanced curly braces`
                ).toBe(closeBraces);
            });
        });
    });

    it('should have balanced square brackets', () => {
        Object.entries(ALL_SNIPPETS).forEach(([moduleName, snippets]) => {
            Object.entries(snippets).forEach(([snippetName, code]) => {
                const openBrackets = (code.match(/\[/g) || []).length;
                const closeBrackets = (code.match(/\]/g) || []).length;

                expect(
                    openBrackets,
                    `${moduleName}.${snippetName} should have balanced square brackets`
                ).toBe(closeBrackets);
            });
        });
    });
});

describe('Property: SDK Method Coverage', () => {
    /**
     * Each SDK module should have code snippets for its key methods
     */
    it('should have token module snippets for key operations', () => {
        const tokenSnippets = Object.keys(TOKEN_CODE_SNIPPETS);

        // Key token operations that should have snippets
        const expectedOperations = ['getTokenInfo', 'balanceOf', 'mint', 'transfer'];

        expectedOperations.forEach(op => {
            expect(
                tokenSnippets.some(s => s.toLowerCase().includes(op.toLowerCase())),
                `Token module should have snippet for ${op}`
            ).toBe(true);
        });
    });

    it('should have KYC module snippets for key operations', () => {
        const kycSnippets = Object.keys(KYC_CODE_SNIPPETS);

        // Key KYC operations that should have snippets
        const expectedOperations = ['isVerified', 'addInvestor', 'getInvestorInfo'];

        expectedOperations.forEach(op => {
            expect(
                kycSnippets.some(s => s.toLowerCase().includes(op.toLowerCase())),
                `KYC module should have snippet for ${op}`
            ).toBe(true);
        });
    });

    it('should have yield module snippets for key operations', () => {
        const yieldSnippets = Object.keys(YIELD_CODE_SNIPPETS);

        // Key yield operations that should have snippets
        const expectedOperations = ['distribution', 'claim'];

        expectedOperations.forEach(op => {
            expect(
                yieldSnippets.some(s => s.toLowerCase().includes(op.toLowerCase())),
                `Yield module should have snippet for ${op}`
            ).toBe(true);
        });
    });

    it('should have compliance module snippets for key operations', () => {
        const complianceSnippets = Object.keys(COMPLIANCE_CODE_SNIPPETS);

        // Key compliance operations that should have snippets
        const expectedOperations = ['checkTransferEligibility', 'generateReport'];

        expectedOperations.forEach(op => {
            expect(
                complianceSnippets.some(s => s.toLowerCase().includes(op.toLowerCase())),
                `Compliance module should have snippet for ${op}`
            ).toBe(true);
        });
    });
});

describe('Property: Code Snippet Copyability', () => {
    /**
     * Arbitrary generator for snippet selection
     */
    const snippetArb = fc.constantFrom(
        ...Object.entries(ALL_SNIPPETS).flatMap(([module, snippets]) =>
            Object.entries(snippets).map(([name, code]) => ({
                module,
                name,
                code,
            }))
        )
    );

    it('should produce valid strings that can be copied', () => {
        fc.assert(
            fc.property(snippetArb, ({ module, name, code }) => {
                // Code should be a valid string
                expect(typeof code).toBe('string');

                // Code should not contain null bytes or other problematic characters
                expect(code.includes('\0')).toBe(false);

                // Code should be trimmable without losing essential content
                const trimmed = code.trim();
                expect(trimmed.length).toBeGreaterThan(0);

                return true;
            }),
            { numRuns: 50 }
        );
    });

    it('should contain SDK-specific patterns', () => {
        fc.assert(
            fc.property(snippetArb, ({ module, name, code }) => {
                // Should reference client, module, or SDK patterns
                const hasSDKPattern =
                    code.includes('client') ||
                    code.includes('await') ||
                    code.includes('const') ||
                    code.includes('function');

                expect(hasSDKPattern).toBe(true);
                return true;
            }),
            { numRuns: 50 }
        );
    });
});
