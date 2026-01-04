
import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t bg-slate-50 py-12 mt-auto">
      <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-4">
        
        {/* Professional Identity */}
        <div className="space-y-1">
            <h3 className="font-semibold text-lg text-slate-900">Dogbalou Motognon Wastalas d'Assise</h3>
            <p className="text-slate-600 font-medium">PhD Student in Applied Data Science & AI</p>
        </div>

        {/* Links & Contact */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-sm text-slate-500">
            <a 
                href="https://sites.google.com/view/dogbaloumotognonwastalas" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors underline underline-offset-4"
            >
                Personal Website
            </a>
            <span className="hidden sm:inline">•</span>
            <a 
                href="mailto:wastalasdassise@gmail.com" 
                className="hover:text-blue-600 transition-colors"
            >
                wastalasdassise@gmail.com
            </a>
        </div>

        {/* Technical Attribution & Copyright */}
        <div className="pt-4 border-t border-slate-200 w-full max-w-md flex flex-col gap-1 text-xs text-slate-400">
            <p>© 2025 Dogbalou Motognon. All rights reserved.</p>
            <p>Powered by OpenAI & Convex</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
