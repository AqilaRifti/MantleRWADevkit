'use client';

/**
 * CodeSnippet - Collapsible code display component with syntax highlighting
 */

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Check, ChevronDown, ChevronRight, Copy, Code2 } from 'lucide-react';

export interface CodeSnippetProps {
    title?: string;
    code: string;
    language?: 'typescript' | 'javascript' | 'json' | 'solidity';
    collapsible?: boolean;
    defaultExpanded?: boolean;
    imports?: string;
    className?: string;
    showLineNumbers?: boolean;
}

interface Token {
    type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'text';
    value: string;
}

/**
 * Tokenize code for syntax highlighting
 */
function tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    const keywords = new Set([
        'const', 'let', 'var', 'function', 'async', 'await', 'return',
        'if', 'else', 'for', 'while', 'try', 'catch', 'throw', 'new',
        'import', 'from', 'export', 'default', 'class', 'extends',
        'interface', 'type', 'enum', 'true', 'false', 'null', 'undefined',
    ]);

    let i = 0;
    while (i < code.length) {
        // Single-line comment
        if (code[i] === '/' && code[i + 1] === '/') {
            let comment = '';
            while (i < code.length && code[i] !== '\n') {
                comment += code[i++];
            }
            tokens.push({ type: 'comment', value: comment });
            continue;
        }

        // Multi-line comment
        if (code[i] === '/' && code[i + 1] === '*') {
            let comment = '/*';
            i += 2;
            while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
                comment += code[i++];
            }
            if (i < code.length) {
                comment += '*/';
                i += 2;
            }
            tokens.push({ type: 'comment', value: comment });
            continue;
        }

        // String (single, double, or backtick)
        if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
            const quote = code[i];
            let str = quote;
            i++;
            while (i < code.length && code[i] !== quote) {
                if (code[i] === '\\' && i + 1 < code.length) {
                    str += code[i++];
                }
                str += code[i++];
            }
            if (i < code.length) {
                str += code[i++];
            }
            tokens.push({ type: 'string', value: str });
            continue;
        }

        // Number
        if (/\d/.test(code[i])) {
            let num = '';
            while (i < code.length && /[\d.n]/.test(code[i])) {
                num += code[i++];
            }
            tokens.push({ type: 'number', value: num });
            continue;
        }

        // Word (keyword or identifier)
        if (/[a-zA-Z_$]/.test(code[i])) {
            let word = '';
            while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
                word += code[i++];
            }
            // Check if it's a function call
            let j = i;
            while (j < code.length && /\s/.test(code[j])) j++;
            if (code[j] === '(') {
                tokens.push({ type: 'function', value: word });
            } else if (keywords.has(word)) {
                tokens.push({ type: 'keyword', value: word });
            } else {
                tokens.push({ type: 'text', value: word });
            }
            continue;
        }

        // Other characters
        tokens.push({ type: 'text', value: code[i++] });
    }

    return tokens;
}

/**
 * Render highlighted code as React elements
 */
function HighlightedCode({ code }: { code: string }) {
    const tokens = useMemo(() => tokenize(code), [code]);

    return (
        <>
            {tokens.map((token, i) => {
                switch (token.type) {
                    case 'keyword':
                        return <span key={i} className="text-purple-500 font-medium">{token.value}</span>;
                    case 'string':
                        return <span key={i} className="text-green-500">{token.value}</span>;
                    case 'comment':
                        return <span key={i} className="text-gray-500 italic">{token.value}</span>;
                    case 'number':
                        return <span key={i} className="text-orange-500">{token.value}</span>;
                    case 'function':
                        return <span key={i} className="text-blue-500">{token.value}</span>;
                    default:
                        return <span key={i}>{token.value}</span>;
                }
            })}
        </>
    );
}

export function CodeSnippet({
    title,
    code,
    language = 'typescript',
    collapsible = true,
    defaultExpanded = false,
    imports,
    className,
    showLineNumbers = false,
}: CodeSnippetProps) {
    const [isOpen, setIsOpen] = useState(defaultExpanded);
    const [copied, setCopied] = useState(false);

    const fullCode = imports ? `${imports}\n\n${code}` : code;

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(fullCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [fullCode]);

    const codeLines = code.split('\n');

    const codeContent = (
        <div className="relative group">
            {imports && (
                <div className="px-4 py-2 bg-muted/30 border-b text-xs font-mono text-muted-foreground">
                    <HighlightedCode code={imports} />
                </div>
            )}
            <div className="relative">
                <pre className={cn(
                    "p-4 overflow-x-auto text-sm font-mono",
                    showLineNumbers && "pl-12"
                )}>
                    {showLineNumbers && (
                        <div className="absolute left-0 top-0 pt-4 pl-3 select-none text-muted-foreground/50 text-right w-8">
                            {codeLines.map((_, i) => (
                                <div key={i} className="leading-relaxed">
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    )}
                    <code className="leading-relaxed">
                        <HighlightedCode code={code} />
                    </code>
                </pre>
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied' : 'Copy code'}
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );

    if (!collapsible) {
        return (
            <div className={cn(
                "rounded-lg border bg-muted/50 overflow-hidden",
                className
            )}>
                {title && (
                    <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{title}</span>
                    </div>
                )}
                {codeContent}
            </div>
        );
    }

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className={cn(
                "rounded-lg border bg-muted/50 overflow-hidden",
                className
            )}
        >
            <CollapsibleTrigger asChild>
                <button className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted/70 transition-colors text-left">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        {title || 'View Code'}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                        {language}
                    </span>
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="border-t">
                    {codeContent}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

export default CodeSnippet;
