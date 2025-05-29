import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const [originalQuery, setOriginalQuery] = useState('');
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [fieldValues, setFieldValues] = useState<Record<string, string[]>>({});
    const [numCopies, setNumCopies] = useState(1);
    const [copied, setCopied] = useState(false);

    const extractedFields = useMemo(() => {
        if (!originalQuery.trim().toLowerCase().startsWith('insert')) {
            return null;
        }

        try {
            // Remove SQL comments first
            const queryWithoutComments = originalQuery
                .replace(/--.*$/gm, '') // Remove single line comments
                .replace(/\/\*[\s\S]*?\*\//gm, ''); // Remove multi-line comments

            // Match the INSERT statement with a more robust regex that handles multi-line values
            const matches = queryWithoutComments.match(/insert\s+into\s+(["\w\.]+)\s*\(([\s\S]*?)\)\s*values\s*\(([\s\S]*?)(?=\)\s*(?:;|$))/i);
            if (!matches) return null;

            const tableName = matches[1];
            const columns = matches[2].split(',').map(col => col.trim());

            // Parse values more carefully to handle nested parentheses and quotes
            let valuesStr = matches[3];
            const values: string[] = [];
            let currentValue = '';
            let inQuote = false;
            let quoteChar = '';
            let parenthesesCount = 0;

            for (let i = 0; i < valuesStr.length; i++) {
                const char = valuesStr[i];

                if ((char === "'" || char === '"') && valuesStr[i - 1] !== '\\') {
                    if (!inQuote) {
                        inQuote = true;
                        quoteChar = char;
                    } else if (char === quoteChar) {
                        inQuote = false;
                    }
                }

                if (!inQuote) {
                    if (char === '(') parenthesesCount++;
                    if (char === ')') parenthesesCount--;
                }

                if (!inQuote && parenthesesCount === 0 && char === ',') {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());

            // Clean up the values
            const cleanedValues = values.map(val =>
                val.trim().replace(/^['"]|['"]$/g, '')
            );

            return {
                tableName,
                fields: columns.map((column, index) => ({
                    column,
                    value: cleanedValues[index] || ''
                }))
            };
        } catch (e) {
            console.error('Error parsing SQL:', e);
            return null;
        }
    }, [originalQuery]);

    const generateModifiedQueries = useMemo(() => {
        if (!extractedFields) return '';

        const queries = [];
        for (let i = 0; i < numCopies; i++) {
            const allFields = extractedFields.fields.map(field => {
                const newValues = fieldValues[field.column];
                return {
                    column: field.column,
                    value: newValues?.[i] !== undefined ? newValues[i] : field.value
                };
            });

            const columns = allFields.map(f => f.column).join(', ');
            const values = allFields.map(f => {
                // Check if value is a function call (e.g. TO_TIMESTAMP, NOW, etc)
                if (/^[A-Z_]+\s*\(.*\)$/.test(f.value.toUpperCase()) ||
                    /^[A-Z_]+\s*\(\)$/.test(f.value.toUpperCase()) ||
                    /^[A-Z_]+$/.test(f.value.toUpperCase())) {
                    return f.value;
                }
                // Otherwise escape single quotes and wrap in quotes
                const escapedValue = f.value.replace(/'/g, "''");
                return `'${escapedValue}'`;
            }).join(', ');

            queries.push(`INSERT INTO ${extractedFields.tableName} (${columns}) VALUES (${values});`);
        }

        return queries.join('\n');
    }, [extractedFields, fieldValues, numCopies]);

    return (
        <>
            <PageHeader>
                <PageHeaderHeading>SQL Query Modifier</PageHeaderHeading>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>Modify SQL Query</CardTitle>
                    <CardDescription>Paste your INSERT query and create multiple modified versions</CardDescription>

                    <div className="space-y-4">
                        <div className="grid gap-4">
                            <Textarea
                                placeholder="Paste your INSERT query here..."
                                className="min-h-[150px] font-mono text-sm"
                                value={originalQuery}
                                onChange={(e) => setOriginalQuery(e.target.value)}
                            />

                            {extractedFields && (
                                <>
                                    <div className="flex items-center gap-8 mt-4">
                                        <div className="flex items-center gap-4">
                                            <Label>Number of Copies</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={numCopies}
                                                onChange={(e) => setNumCopies(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-24"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 flex-1">
                                            <Label>Select Fields to Edit</Label>
                                            <MultiSelect
                                                options={extractedFields.fields.map(field => ({
                                                    label: field.column,
                                                    value: field.column
                                                }))}
                                                selected={selectedFields}
                                                onChange={setSelectedFields}
                                                placeholder="Select fields to edit"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedFields.length > 0 && extractedFields && (
                                <div className="grid gap-6">
                                    {selectedFields.map((fieldName) => {
                                        const field = extractedFields.fields.find(f => f.column === fieldName);
                                        return (
                                            <div key={fieldName} className="grid gap-4">
                                                {Array.from({ length: numCopies }).map((_, index) => (
                                                    <div key={index} className="grid gap-2">
                                                        <Label className="text-sm text-muted-foreground">{fieldName} (Copy {index + 1})</Label>
                                                        <Textarea
                                                            value={fieldValues[fieldName]?.[index] ?? field?.value ?? ''}
                                                            onChange={(e) => {
                                                                setFieldValues(prev => {
                                                                    const newValues = [...(prev[fieldName] || [])];
                                                                    newValues[index] = e.target.value;
                                                                    return {
                                                                        ...prev,
                                                                        [fieldName]: newValues
                                                                    };
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {generateModifiedQueries && (
                                <div className="grid gap-2">
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(generateModifiedQueries);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                        >
                                            {copied ? "Copied!" : "Copy to Clipboard"}
                                        </Button>
                                    </div>
                                    <Textarea
                                        readOnly
                                        className="min-h-[200px] font-mono text-sm"
                                        value={generateModifiedQueries}
                                        placeholder="Modified queries will appear here..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </>
    );
}
