import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { BlockMath } from "react-katex";

export const NotationHelp = () => {
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
                    <DialogTitle>Mathematical Notation Guide</DialogTitle>
                    <DialogDescription>
                        Use LaTeX to format your mathematical reasoning.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-6 py-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider">Basic Operations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Fraction</p>
                                <code className="text-sm bg-white border px-1 rounded">\frac{'{'}a{'}'}{'{'}b{'}'}</code>
                                <div className="mt-2 text-center"><BlockMath math="\frac{a}{b}" /></div>
                            </div>
                            <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Power / Exponent</p>
                                <code className="text-sm bg-white border px-1 rounded">x^2</code>
                                <div className="mt-2 text-center"><BlockMath math="x^2" /></div>
                            </div>
                            <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Square Root</p>
                                <code className="text-sm bg-white border px-1 rounded">\sqrt{'{'}x{'}'}</code>
                                <div className="mt-2 text-center"><BlockMath math="\sqrt{x}" /></div>
                            </div>
                             <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Multiplication</p>
                                <code className="text-sm bg-white border px-1 rounded">\times or \cdot</code>
                                <div className="mt-2 text-center"><BlockMath math="a \times b \cdot c" /></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider">Calculus Symbols</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Limit</p>
                                <code className="text-sm bg-white border px-1 rounded">\lim_&#123;x \to a&#125; f(x)</code>
                                <div className="mt-2 text-center"><BlockMath math="\lim_{x \to a} f(x)" /></div>
                            </div>
                             <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Infinity</p>
                                <code className="text-sm bg-white border px-1 rounded">\infty</code>
                                <div className="mt-2 text-center"><BlockMath math="\infty" /></div>
                            </div>
                            <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Integral</p>
                                <code className="text-sm bg-white border px-1 rounded">\int_a^b f(x) dx</code>
                                <div className="mt-2 text-center"><BlockMath math="\int_a^b f(x) dx" /></div>
                            </div>
                             <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Summation</p>
                                <code className="text-sm bg-white border px-1 rounded">\sum_ {'{'}i=0{'}'}^n i</code>
                                <div className="mt-2 text-center"><BlockMath math="\sum_{i=0}^n i" /></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider">Linear Algebra</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Matrix</p>
                                <code className="text-sm bg-white border px-1 rounded text-xs">\begin{'{'}pmatrix{'}'} a & b \\ c & d \end{'{'}pmatrix{'}'}</code>
                                <div className="mt-2 text-center"><BlockMath math="\begin{pmatrix} a & b \\ c & d \end{pmatrix}" /></div>
                            </div>
                             <div className="border p-3 rounded-md bg-slate-50">
                                <p className="text-xs font-mono text-slate-500 mb-1">Vector</p>
                                <code className="text-sm bg-white border px-1 rounded">\mathbf{'{'}v{'}'} or \vec{'{'}v{'}'}</code>
                                <div className="mt-2 text-center"><BlockMath math="\mathbf{v}, \vec{v}" /></div>
                            </div>
                        </div>
                    </div>
                     <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm">
                        <p className="font-medium text-blue-800 mb-1">Pro Tip:</p>
                        <p className="text-blue-700">
                            Wrap your math in <code>$ ... $</code> for inline math (like this: <span className="font-serif italic">x</span>) or 
                            <code> $$ ... $$</code> for a centered block equation.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
