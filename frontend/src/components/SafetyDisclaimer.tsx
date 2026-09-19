import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface SafetyDisclaimerProps {
  compact?: boolean;
}

export const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5 flex items-start gap-2.5 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Educational Prototype Only:</span> Not a medical device. Never change medication dosages or start/stop medicines without consulting a licensed pharmacist or physician.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 rounded-xl p-4 shadow-lg flex items-start gap-3.5 text-sm text-amber-200/90 my-4">
      <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h4 className="font-bold text-amber-300 text-base flex items-center gap-2">
          Core Medical Safety Notice & Prototype Disclaimer
        </h4>
        <p className="leading-relaxed">
          MedSafe AI is strictly an <strong>educational research prototype</strong> and <strong>is not a certified medical device</strong>.
          It does not provide medical diagnoses, treatment advice, or dosage changes. Never stop, start, or alter any medication based on this tool.
        </p>
        <p className="text-xs text-amber-300/80 font-mono pt-1">
          High-risk or emergency warnings advise contacting a licensed pharmacist, prescribing physician, poison-control center (1-800-222-1222), or local emergency services (911).
        </p>
      </div>
    </div>
  );
};
