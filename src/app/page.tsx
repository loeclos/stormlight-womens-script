'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Footer from '@/components/ui/footer';

interface AlethiConfig {
    borderSize: number;
    lineHeight: number;
    lineSpacing: number;
    wordSpacing: number;
    images: Map<string, SVGElement>;
    imageWidths: Map<string, number>;
    symbols: string[];
    tokens: Set<string>;
    charSubstitutions: Map<RegExp, string>;
    wordSubstitutions: Map<RegExp, string>;
    imageUrl: string;
}

const Alethi: AlethiConfig = {
    borderSize: 5,
    lineHeight: 61,
    lineSpacing: 10,
    wordSpacing: 10,
    images: new Map(),
    imageWidths: new Map(),
    symbols: [
        'A',
        'B',
        'CH',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'R',
        'S',
        'SH',
        'T',
        'TH',
        'U',
        'V',
        'Y',
        'Z',
        '][',
    ],
    tokens: new Set(),
    charSubstitutions: new Map(),
    wordSubstitutions: new Map(),
    imageUrl: '',
};

const AlethiScript: React.FC = () => {
    const [sourceText, setSourceText] = useState<string>(
        'Szeth son son Vallano\nTruthless of Shinovar\nwore white on the day\nhe was to kill a king'
    );
    const [wordSubstitutionText, setWordSubstitutionText] =
        useState<string>('');
    const [charSubstitutionText, setCharSubstitutionText] =
        useState<string>('');
    const [wordSubstitutionError, setWordSubstitutionError] =
        useState<string>('');
    const [charSubstitutionError, setCharSubstitutionError] =
        useState<string>('');
    const [fgColor, setFgColor] = useState<string>('#000000');
    const [bgColor, setBgColor] = useState<string>('#ffffff');
    const [transparentBg, setTransparentBg] = useState<boolean>(false);
    const [align, setAlign] = useState<string>('center');
    const [italicsAngle, setItalicsAngle] = useState<number>(10);
    const [strokeWidth, setStrokeWidth] = useState<number>(1);
    const [scale, setScale] = useState<number>(1);
    const [autoHeightMark, setAutoHeightMark] = useState<boolean>(true);
    const [format, setFormat] = useState<string>('png');
    const svgRef = useRef<SVGSVGElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const loadImages = async () => {
        await Promise.all(
            Alethi.symbols.map(async (symbol) => {
                const response = await fetch(`/symbols/${symbol}.svg`);
                const text = await response.text();
                const cleanedText = text
                    .replace(/stroke:#[0-9a-fA-F]*;?/g, '')
                    .replace(/stroke-width:[0-9a-zA-Z]*;?/g, '');
                const parser = new DOMParser();
                const svgNode = parser.parseFromString(cleanedText, 'text/xml');
                const gElement = svgNode.querySelector('g');
                if (gElement) {
                    Alethi.images.set(symbol, gElement);
                    Alethi.imageWidths.set(
                        symbol,
                        parseInt(
                            svgNode.documentElement.getAttribute('width') || '0'
                        )
                    );
                }
            })
        );
    };

    const loadSubstitutions = async (
        path: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const response = await fetch(path);
        const text = await response.text();
        setter(text.trim());
        return true;
    };

    const regexEscape = (string: string): string => {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    };

    const generateSubstitutions = (
        text: string,
        setError: React.Dispatch<React.SetStateAction<string>>,
        regexGen: (input: string) => RegExp
    ): Map<RegExp, string> | null => {
        const tokenRemover = new RegExp(
            `(.*?)(${Alethi.symbols.map(regexEscape).join('|')}|\\\\)`,
            'g'
        );
        const substitutions = new Map<RegExp, string>();
        const errors: string[] = [];
        const lines = text.toUpperCase().split('\n');
        lines.forEach((line, index) => {
            line = line.trim();
            if (line.length > 0) {
                const parts = line.split(' ');
                if (parts.length === 2) {
                    const input = regexGen(parts[0]);
                    const output = parts[1];
                    if (output.replace(tokenRemover, '$1').length === 0) {
                        substitutions.set(input, output);
                    } else {
                        errors.push(
                            `#${
                                index + 1
                            } "${line}" does not map only to women's script symbols`
                        );
                    }
                } else {
                    errors.push(
                        `#${
                            index + 1
                        } "${line}" should be two parts separated by a space`
                    );
                }
            }
        });
        setError(errors.join(', '));
        return errors.length === 0 ? substitutions : null;
    };

    const regenerateWordSubstitutions = () => {
        const substitutions = generateSubstitutions(
            wordSubstitutionText,
            setWordSubstitutionError,
            (word) => new RegExp(`^${regexEscape(word)}$`)
        );
        if (substitutions) {
            Alethi.wordSubstitutions = substitutions;
            generateText();
        }
    };

    const regenerateCharSubstitutions = () => {
        const regexBuilder = (inputString: string) => {
            const escapedInput = regexEscape(inputString);
            const remainderMatcher = Alethi.symbols
                .filter((symbol) => symbol.startsWith(inputString))
                .map((symbol) => symbol.substring(inputString.length))
                .map(regexEscape)
                .join('|');
            return remainderMatcher.length > 0
                ? new RegExp(`${escapedInput}(?!${remainderMatcher})`, 'g')
                : new RegExp(escapedInput, 'g');
        };
        const substitutions = generateSubstitutions(
            charSubstitutionText,
            setCharSubstitutionError,
            regexBuilder
        );
        if (substitutions) {
            Alethi.charSubstitutions = substitutions;
            generateText();
        }
    };

    const getRawLines = (): string[] => {
        return sourceText.trim().toUpperCase().split('\n');
    };

    const getSubstitutedLines = (rawLines: string[]): string[] => {
        const subbedLines: string[] = [];
        for (const rawLine of rawLines) {
            const rawWords = rawLine.split(' ');
            const subbedWords: string[] = [];
            for (const word of rawWords) {
                let subbed = false;
                for (const [regex, symbols] of Alethi.wordSubstitutions) {
                    if (regex.test(word)) {
                        subbedWords.push(symbols);
                        subbed = true;
                        break;
                    }
                }
                if (!subbed) {
                    let newWord = word;
                    Alethi.charSubstitutions.forEach((tokens, regex) => {
                        newWord = newWord.replace(regex, tokens);
                    });
                    subbedWords.push(newWord);
                }
            }
            subbedLines.push(subbedWords.join(' '));
        }
        return subbedLines;
    };

    const getTokenRows = (substitutedLines: string[]): string[][] => {
        const tokenRows: string[][] = [];
        let newParagraph = true;
        for (let line of substitutedLines) {
            line = line.trim();
            const tokenRow: string[] = [];
            if (line.length > 0) {
                if (autoHeightMark && newParagraph && !line.startsWith('][')) {
                    tokenRow.push('][');
                }
                newParagraph = false;
            } else {
                newParagraph = true;
            }
            let index = 0;
            while (index < line.length) {
                let token = line.substr(index, 2);
                if (!Alethi.tokens.has(token)) {
                    token = line.substr(index, 1);
                }
                if (Alethi.tokens.has(token)) {
                    tokenRow.push(token);
                }
                index += token.length;
            }
            tokenRows.push(tokenRow);
        }
        return tokenRows;
    };

    const generateText = () => {
        if (!svgRef.current) return;
        const svg = svgRef.current;
        while (svg.hasChildNodes()) {
            svg.removeChild(svg.firstChild!);
        }

        setBackground();
        setForeground();

        const italicOffset =
            Alethi.lineHeight * Math.tan((italicsAngle * Math.PI) / 180);
        let imgWidth = 0;
        let imgHeight = 0;

        const rowSymbolGroups: SVGElement[] = [];
        const rowWidths: number[] = [];
        const tokenRows = getTokenRows(getSubstitutedLines(getRawLines()));

        for (let i = 0; i < tokenRows.length; i++) {
            if (i !== 0) {
                imgHeight += Alethi.lineSpacing;
            }
            let rowWidth = italicOffset < 0 ? -italicOffset : 0;
            const rowSymbolGroup = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'g'
            );
            for (const token of tokenRows[i]) {
                if (token !== ' ') {
                    const symbol = Alethi.images
                        .get(token)
                        ?.cloneNode(true) as SVGElement;
                    if (symbol) {
                        symbol.setAttribute(
                            'transform',
                            `translate(${rowWidth},0)`
                        );
                        rowSymbolGroup.appendChild(symbol);
                        rowWidth += Alethi.imageWidths.get(token) || 0;
                    }
                } else {
                    rowWidth += Alethi.wordSpacing;
                }
            }
            if (italicOffset > 0) {
                rowWidth += italicOffset;
            }
            if (rowWidth > imgWidth) {
                imgWidth = rowWidth;
            }
            svg.appendChild(rowSymbolGroup);
            rowWidths.push(rowWidth);
            rowSymbolGroups.push(rowSymbolGroup);
            imgHeight += Alethi.lineHeight;
        }

        let yOffset = Alethi.borderSize;
        for (let i = 0; i < rowSymbolGroups.length; i++) {
            const group = rowSymbolGroups[i];
            const width = rowWidths[i];
            let xOffset = Alethi.borderSize + italicOffset;
            if (align === 'center') {
                xOffset += Math.round((imgWidth - width) / 2);
            } else if (align === 'right') {
                xOffset += imgWidth - width;
            }
            group.setAttribute(
                'transform',
                `scale(${scale}) translate(${xOffset},${yOffset}) skewX(${-italicsAngle})`
            );
            yOffset += Alethi.lineHeight + Alethi.lineSpacing;
        }

        svg.setAttribute(
            'width',
            `${(imgWidth + 2 * Alethi.borderSize) * scale}`
        );
        svg.setAttribute(
            'height',
            `${(imgHeight + 2 * Alethi.borderSize) * scale}`
        );
        const description = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'desc'
        );
        description.textContent = `The text '${sourceText}' displayed in women's script from The Stormlight Archive`;
        svg.appendChild(description);

        displayImage();
    };

    const displayImage = () => {
        if (!svgRef.current || !imageRef.current) return;
        const svg = svgRef.current;
        const data = new XMLSerializer().serializeToString(svg);
        const domURL = window.URL || window.webkitURL || window;
        const svgBlob = new Blob([data], { type: 'image/svg+xml' });

        if (Alethi.imageUrl) {
            domURL.revokeObjectURL(Alethi.imageUrl);
        }
        Alethi.imageUrl = domURL.createObjectURL(svgBlob);

        if (format === 'svg') {
            imageRef.current.src = Alethi.imageUrl;
        } else if (format === 'png') {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) return;
            canvas.width = parseInt(svg.getAttribute('width') || '0');
            canvas.height = parseInt(svg.getAttribute('height') || '0');
            const image = new window.Image();
            image.onload = () => {
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                domURL.revokeObjectURL(Alethi.imageUrl);
                canvas.toBlob((blob) => {
                    if (blob) {
                        Alethi.imageUrl = domURL.createObjectURL(blob);
                        imageRef.current!.src = Alethi.imageUrl;
                    }
                });
            };
            image.src = Alethi.imageUrl;
        }
    };

    const setBackground = () => {
        if (!svgRef.current || transparentBg) return;
        const svg = svgRef.current;
        const bg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'rect'
        );
        bg.setAttribute('width', '100%');
        bg.setAttribute('height', '100%');
        bg.setAttribute('fill', bgColor);
        svg.insertBefore(bg, svg.firstChild);
    };

    const setForeground = () => {
        const style = `stroke:${fgColor};stroke-width:${
            strokeWidth / scale
        }px;`;
        Alethi.images.forEach((symbol) => {
            symbol.setAttribute('style', style);
        });
    };

    const downloadImageAsPNG = () => {
        if (!svgRef.current) return;
        const svg = svgRef.current;
        const data = new XMLSerializer().serializeToString(svg);
        const domURL = window.URL || window.webkitURL || window;
        const svgBlob = new Blob([data], { type: 'image/svg+xml' });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.width = parseInt(svg.getAttribute('width') || '0');
        canvas.height = parseInt(svg.getAttribute('height') || '0');
        const image = new window.Image();
        image.onload = () => {
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = domURL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'womens-script.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    domURL.revokeObjectURL(url);
                }
            });
        };
        image.src = domURL.createObjectURL(svgBlob);
    };

    useEffect(() => {
        Alethi.tokens = new Set(Alethi.symbols).add(' ');
        const initialize = async () => {
            await loadImages();
            await loadSubstitutions(
                '/defaultSubstitutions/word.txt',
                setWordSubstitutionText
            );
            await loadSubstitutions(
                '/defaultSubstitutions/character.txt',
                setCharSubstitutionText
            );
            regenerateWordSubstitutions();
            regenerateCharSubstitutions();
            generateText();
        };
        initialize();
    }, []);

    useEffect(() => {
        generateText();
    }, [
        sourceText,
        fgColor,
        bgColor,
        transparentBg,
        align,
        italicsAngle,
        strokeWidth,
        scale,
        autoHeightMark,
        format,
    ]);

    useEffect(() => {
        regenerateWordSubstitutions();
    }, [wordSubstitutionText]);

    useEffect(() => {
        regenerateCharSubstitutions();
    }, [charSubstitutionText]);
    return (
        <div className="font-sans">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-5 mb-4 p-10">
                <div>
                    <h1 className="text-5xl">Women's Script</h1>
                    <p className=" py-3">
                        Turn text into{' '}
                        <Link
                            className="underline"
                            href="https://coppermind.net/wiki/Women%27s_script"
                        >
                            women's script
                        </Link>{' '}
                        from The Stormlight Archive.
                    </p>
                    <Textarea
                        id="sourceText"
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                    />
                    <Button
                        onClick={downloadImageAsPNG}
                        className="my-3 w-full cursor-pointer"
                    >
                        Download as PNG
                    </Button>
                </div>
                <div className="border p-2 rounded-xl border-gray-300 shadow-lg">
                    <div>
                        <svg
                            id="drawingArea"
                            className="rounded-lg"
                            ref={svgRef}
                        />
                    </div>
                    <Image
                        id="outputImage"
                        className="rounded-lg"
                        ref={imageRef}
                        src=""
                        alt="Generated Women's Script"
                        width={0}
                        height={0}
                    />
                </div>
            </div>

            <Accordion
                type="single"
                collapsible
                className="w-full px-10 md:w-3/4 mx-auto mb-10"
            >
                <AccordionItem value="symbols">
                    <AccordionTrigger className="font-mono text-lg">
                        Symbols
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="mb-4 indent-2">
                            The symbols in women's script do not directly map to
                            English letters, but to their sounds. There are also
                            symbols for the "ch", "sh", and "th" sounds.
                        </p>
                        <p className="mb-4 indent-2">
                            Women's script also has a symbol that indicates the
                            maximum height of symbols in a block of text. By
                            default, this generator will add it automatically at
                            the start of the text and after blank lines. You can
                            turn this off in the formatting section, or add them
                            in your text by typing "]["
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-4">
                            {Alethi.symbols.map((symbol) => (
                                <div
                                    key={symbol}
                                    className="flex flex-col items-center"
                                >
                                    <Image
                                        src={`/symbols/${symbol}.svg`}
                                        alt={symbol}
                                        className="max-h-20"
                                        width={50}
                                        height={50}
                                    />
                                    <p className="text-sm">
                                        {symbol === ']['
                                            ? '][ (line height)'
                                            : symbol}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="formatting">
                    <AccordionTrigger className="font-mono text-lg">
                        Formatting
                    </AccordionTrigger>
                    <AccordionContent>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Text colour</TableCell>
                                    <TableCell>
                                        <input
                                            type="color"
                                            value={fgColor}
                                            onChange={(e) =>
                                                setFgColor(e.target.value)
                                            }
                                            id="fgColourPicker"
                                            className="w-12 h-12"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Background colour</TableCell>
                                    <TableCell>
                                        <input
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) =>
                                                setBgColor(e.target.value)
                                            }
                                            id="bgColourPicker"
                                            className="w-12 h-12"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>
                                        Transparent background
                                    </TableCell>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={transparentBg}
                                            onChange={(e) =>
                                                setTransparentBg(
                                                    e.target.checked
                                                )
                                            }
                                            id="transparentBgCheckbox"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Left align text</TableCell>
                                    <TableCell>
                                        <input
                                            type="radio"
                                            name="align"
                                            value="left"
                                            checked={align === 'left'}
                                            onChange={(e) =>
                                                setAlign(e.target.value)
                                            }
                                            id="leftAlignCheckbox"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Center align text</TableCell>
                                    <TableCell>
                                        <input
                                            type="radio"
                                            name="align"
                                            value="center"
                                            checked={align === 'center'}
                                            onChange={(e) =>
                                                setAlign(e.target.value)
                                            }
                                            id="centerAlignCheckbox"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Right align text</TableCell>
                                    <TableCell>
                                        <input
                                            type="radio"
                                            name="align"
                                            value="right"
                                            checked={align === 'right'}
                                            onChange={(e) =>
                                                setAlign(e.target.value)
                                            }
                                            id="rightAlignCheckbox"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Italics angle</TableCell>
                                    <TableCell>
                                        <input
                                            type="number"
                                            value={italicsAngle}
                                            onChange={(e) =>
                                                setItalicsAngle(
                                                    parseInt(e.target.value)
                                                )
                                            }
                                            id="italicsAngleInput"
                                            className="border rounded p-1 w-24"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Stroke width</TableCell>
                                    <TableCell>
                                        <input
                                            type="number"
                                            value={strokeWidth}
                                            onChange={(e) =>
                                                setStrokeWidth(
                                                    parseInt(e.target.value)
                                                )
                                            }
                                            id="strokeWidthInput"
                                            className="border rounded p-1 w-24"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Scale</TableCell>
                                    <TableCell>
                                        <input
                                            type="number"
                                            value={scale}
                                            onChange={(e) =>
                                                setScale(
                                                    parseInt(e.target.value)
                                                )
                                            }
                                            id="scaleInput"
                                            className="border rounded p-1 w-24"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Auto height markers</TableCell>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={autoHeightMark}
                                            onChange={(e) =>
                                                setAutoHeightMark(
                                                    e.target.checked
                                                )
                                            }
                                            id="autoHeightMarkCheckbox"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>PNG image format</TableCell>
                                    <TableCell>
                                        <input
                                            type="radio"
                                            name="format"
                                            value="png"
                                            checked={format === 'png'}
                                            onChange={(e) =>
                                                setFormat(e.target.value)
                                            }
                                            id="pngFormatCheckbox"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>SVG image format</TableCell>
                                    <TableCell>
                                        <input
                                            type="radio"
                                            name="format"
                                            value="svg"
                                            checked={format === 'svg'}
                                            onChange={(e) =>
                                                setFormat(e.target.value)
                                            }
                                            id="svgFormatCheckbox"
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="substitutions">
                    <AccordionTrigger className="font-mono text-lg">
                        Substitutions
                    </AccordionTrigger>
                    <AccordionContent>
                        <p>
                            If there are words or (groups of) characters that do
                            not map directly to sounds of women's script symbols
                            you can either type them phonetically, or enter
                            custom substitutions here. Examples of this could
                            include:
                            <ul className="list-disc pl-5">
                                <li>
                                    words with silent letters or strange
                                    pronunciations
                                </li>
                                <li>
                                    letters that together make a single sound
                                    (the C and K in luck)
                                </li>
                                <li>
                                    letters that make different sounds based on
                                    their neighbors (the C in city sounds like
                                    an S)
                                </li>
                                <li>
                                    letters that don't have their own women's
                                    script symbol (C, Q, W, X)
                                </li>
                            </ul>
                        </p>
                        <p>
                            The available women's script symbols are:{' '}
                            <span className="font-bold">
                                {Alethi.symbols.join(', ')}
                            </span>
                        </p>
                        <p>
                            If you want your substitution to treat "CH", "SH",
                            or "TH" as separate symbols, separate the symbols
                            with a backslash "\" (ie "C\H"). This can also be
                            used to prevent later character substitutions
                            replacing the symbols from an earlier substitution.
                        </p>
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xl font-semibold">
                                Word substitutions
                            </h3>
                            <p>
                                On each line enter a word, followed by a space,
                                then the women's script symbols it should be
                                replaced with.
                            </p>
                            <Textarea
                                id="wordSubstitutionText"
                                value={wordSubstitutionText}
                                onChange={(e) =>
                                    setWordSubstitutionText(e.target.value)
                                }
                                className="min-h-[100px]"
                            />
                            <p className="text-red-500">
                                {wordSubstitutionError}
                            </p>
                            <Button
                                onClick={() =>
                                    loadSubstitutions(
                                        '/defaultSubstitutions/word.txt',
                                        setWordSubstitutionText
                                    )
                                }
                                className="my-3 w-full cursor-pointer"
                            >
                                Restore default word substitutions
                            </Button>
                            <h3 className="text-xl font-semibold">
                                Character substitutions
                            </h3>
                            <p>
                                On each line enter a series of characters,
                                followed by a space, then the women's script
                                symbols they should be replaced with. These
                                replacements will all take place in any text not
                                already replaced by a word substitution, one
                                after the other.
                            </p>
                            <Textarea
                                id="charSubstitutionText"
                                value={charSubstitutionText}
                                onChange={(e) =>
                                    setCharSubstitutionText(e.target.value)
                                }
                                className="min-h-[100px]"
                            />
                            <p className="text-red-500">
                                {charSubstitutionError}
                            </p>
                            <Button
                                onClick={() =>
                                    loadSubstitutions(
                                        '/defaultSubstitutions/character.txt',
                                        setCharSubstitutionText
                                    )
                                }
                                className="my-3 w-full cursor-pointer"
                            >
                                Restore default character substitutions
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <div className="w-full mt-24 md:mt-96 lg:mt-64">
                <Footer />
            </div>
        </div>
    );
};

export default AlethiScript;
