'use client';

/**
 * CodeSnippet - Collapsible code display component with syntax highlighting
 * 
 * Displays SDK code examples with copy-to-clipboard functionality and
 * optional collapsible behavior.
 * 
 * @example
 * ```tsx
 * <CodeSnippet
 *   title="Get Token Balance"
 *   code={`const balance = await client.token.balanceOf(address);`}
 *   language="typescript"
 * />
 * ```
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Check, ChevronDown, ChevronRight, Copy, Code2 } from 'lucide-react';

export interface CodeSnippetProps {
    /** Title displayed above the code */
    title?: string;
    /** The code to display */
    code: string;
    /** Programming language for syntax highlighting */
    language?: 'typescript' | 'javascript' | 'json' | 'solidity';
    /** Whether the snippet is collapsible */
    collapsible?: boolean;
    /** Whether the snippet starts expanded (only applies if collapsible) */
    defaultExpanded?: boolean;
    /** Import statements to show at the top */
    imports?: string;
    /** Additional CSS classes */
    className?: string;
    /** Show line numbers */
    showLineNumbers?: boolean;
}

/**
 * Simple syntax highlighting for TypeScript/JavaScript
 * Uses inline styles to avoid Tailwind class purging issues
 */
function highlightCode(code: string, language: string): string {
    if (language === 'json') {
        // Escape HTML for JSON
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Keywords
    const keywords = [
        'const', 'let', 'var', 'function', 'async', 'await', 'return',
        'if', 'else', 'for', 'while', 'try', 'catch', 'throw', 'new',
        'import', 'from', 'export', 'default', 'class', 'extends',
        'interface', 'type', 'enum', 'true', 'false', 'null', 'undefined',
    ];

    let highlighted = code;

    // Escape HTML first
    highlighted = highlighted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Comments (// and /* */) - gray italic
    highlighted = highlighted.replace(
        /(\/\/.*$)/gm,
        '<span style="color: #6b7280; font-style: italic;">$1</span>'
    );
    highlighted = highlighted.replace(
        /(\/\*[\s\S]*?\*\/)/g,
        '<span style="color: #6b7280; font-style: italic;">$1</span>'
    );

    // Strings - green
    highlighted = highlighted.replace(
        /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span style="color: #22c55e;">$1$2$1</span>'
    );

    // Keywords - purple
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        highlighted = highlighted.replace(
            regex,
            '<span style="color: #a855f7; font-weight: 500;">$1</span>'
        );
    });

    // Numbers - orange
    highlighted = highlighted.replace(
        /\b(\d+n?)\b/g,
        '<span style="color: #f97316;">$1</span>'
    );

    // Function calls - blue
    highlighted = highlighted.replace(
        /\b([a-zA-Z_]\w*)\s*\(/g,
        '<span style="color: #3b82f6;">$1</span>('
    );

    return highlighted;
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
    const highlightedCode = highlightCode(code, language);

    const codeContent = (
        <div className="relative group">
            {imports && (
                <div className="px-4 py-2 bg-muted/30 border-b text-xs font-mono text-muted-foreground">
                    <span
                        dangerouslySetInnerHTML={{
                            __html: highlightCode(imports, language),
                        }}
                    />
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
                    <code
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    />
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
