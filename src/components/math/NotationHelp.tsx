import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, MousePointerClick } from "lucide-react";
import { BlockMath } from "react-katex";

interface NotationHelpProps {
    onInsert?: (code: string) => void;
}

export const NotationHelp = ({ onInsert }: NotationHelpProps) => {
    const handleItemClick = (code: string) => {
        if (onInsert) {
            onInsert(code);
        }
    };

    const NotationItem = ({ title, code, math }: { title: string; code: string; math: string }) => (
        <div 
            className={`group relative border p-3 rounded-md bg-slate-50 transition-all ${onInsert ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/50" : ""}`}
            onClick={() => handleItemClick(code)}
        >
            <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-mono text-slate-500">{title}</p>
                {onInsert && (
                    <MousePointerClick className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
            <code className="text-[10px] bg-white border px-1 rounded break-all">{code}</code>
            <div className="mt-2 text-center overflow-x-auto"><BlockMath math={math} /></div>
            {onInsert && (
                <div className="absolute inset-0 bg-blue-500/0 group-active:bg-blue-500/5 transition-colors rounded-md" />
            )}
        </div>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Keyboard className="h-4 w-4" />
                    Notation Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle>Mathematical Notation Guide</DialogTitle>
                        {onInsert && <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700">Click to Insert</Badge>}
                    </div>
                    <DialogDescription>
                        {onInsert 
                            ? "Click any symbol to automatically insert its LaTeX code into your answer." 
                            : "Use these LaTeX codes to format your mathematical reasoning."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-6 py-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider">Basic Operations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NotationItem title="Fraction" code="\frac{a}{b}" math="\frac{a}{b}" />
                            <NotationItem title="Power / Exponent" code="x^2" math="x^2" />
                            <NotationItem title="Square Root" code="\sqrt{x}" math="\sqrt{x}" />
                            <NotationItem title="Multiplication" code="\cdot" math="a \cdot b" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider">Calculus Symbols</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NotationItem title="Limit" code="\lim_{x \to a} f(x)" math="\lim_{x \to a} f(x)" />
                            <NotationItem title="Natural Logarithm" code="\ln(x)" math="\ln(x)" />
                            <NotationItem title="Infinity" code="\infty" math="\infty" />
                            <NotationItem title="Integral" code="\int f(x) dx" math="\int f(x) dx" />
                            <NotationItem title="Summation" code="\sum_{i=0}^n" math="\sum_{i=0}^n" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider">Linear Algebra</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NotationItem 
                                title="Matrix" 
                                code="\begin{pmatrix} a & b \\ c & d \end{pmatrix}" 
                                math="\begin{pmatrix} a & b \\ c & d \end{pmatrix}" 
                            />
                            <NotationItem title="Vector" code="\vec{v}" math="\vec{v}" />
                            <NotationItem title="Inner Product (Left)" code="\langle" math="\langle u, v \rangle" />
                            <NotationItem title="Inner Product (Right)" code="\rangle" math="\langle u, v \rangle" />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm">
                        <p className="font-medium text-blue-800 mb-1">Pro Tip:</p>
                        <p className="text-blue-700">
                            Wrap your math in <code>$ ... $</code> for inline math or 
                            <code> $$ ... $$</code> for a centered block equation.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

import { Badge } from "@/components/ui/badge";
