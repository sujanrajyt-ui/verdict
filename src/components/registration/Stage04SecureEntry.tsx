import React, { useState } from 'react';
import { Committee, PricingRule, AppSettings } from '../../types';
import { calculatePayableFee, formatCurrency } from '../../utils/pricing';
import { dataService } from '../../services/dataService';
import { 
  CreditCard, 
  QrCode, 
  UploadCloud, 
  CheckCircle2, 
  ArrowLeft, 
  AlertCircle, 
  Lock, 
  FileCheck,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface Stage04SecureEntryProps {
  committee: Committee;
  pricingRules: PricingRule[];
  appSettings: AppSettings;
  branch: string;
  utr: string;
  screenshotPath: string;
  onUpdatePayment: (utr: string, screenshotPath: string) => void;
  onSubmitRegistration: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  submissionError: string | null;
}

export const Stage04SecureEntry: React.FC<Stage04SecureEntryProps> = ({
  committee,
  pricingRules,
  appSettings,
  branch,
  utr,
  screenshotPath,
  onUpdatePayment,
  onSubmitRegistration,
  onBack,
  isSubmitting,
  submissionError,
}) => {
  const [filePreview, setFilePreview] = useState<string | null>(screenshotPath || null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Authoritative dynamic price calculation
  const feeCalculation = calculatePayableFee(committee, pricingRules, branch);

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLocalError('Please upload a valid image file (JPEG, PNG, or WEBP).');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('Image file size must be less than 5MB.');
      return;
    }

    setLocalError(null);
    setIsUploading(true);

    try {
      const uploadedPath = await dataService.uploadPaymentScreenshot(file);
      setFilePreview(uploadedPath);
      onUpdatePayment(utr, uploadedPath);
    } catch {
      setLocalError('Failed to process image receipt. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUtrChange = (value: string) => {
    onUpdatePayment(value.toUpperCase().replace(/\s/g, ''), screenshotPath);
  };

  const isFormReady = Boolean(
    feeCalculation.isAvailable && 
    utr.trim().length >= 8 && 
    (screenshotPath || filePreview)
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 animate-fadeIn">
      {/* Editorial Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/30 border border-red-800/40 text-red-500 text-xs font-mono-code uppercase tracking-widest mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>STAGE 04 — SECURITY & ACCREDITATION</span>
        </div>

        <h1 className="font-cinzel text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase drop-shadow-md">
          SECURE YOUR ENTRY
        </h1>

        <p className="mt-3 font-mono-code text-sm sm:text-base text-zinc-400 max-w-md mx-auto">
          Scan the QR code and complete your payment.
        </p>
      </div>

      {submissionError && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-700/80 text-red-300 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs font-mono-code">{submissionError}</div>
        </div>
      )}

      {!feeCalculation.isAvailable ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="font-cinzel text-xl text-white font-bold">PRICING RULE UNAVAILABLE</h3>
          <p className="text-zinc-400 text-sm font-mono-code">
            Registration pricing is currently unavailable. Please try again later or contact the high command.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* LEFT: PAYMENT SUMMARY & QR CODE */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="font-mono-code text-xs text-zinc-400 uppercase tracking-wider">
                PAYABLE ACCREDITATION FEE
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono-code uppercase bg-red-950/70 border border-red-800/80 text-red-400">
                {feeCalculation.categoryLabel}
              </span>
            </div>

            {/* Dynamic Calculated Amount */}
            <div className="text-left">
              <div className="text-xs font-mono-code text-zinc-500 uppercase tracking-widest">
                REGISTRATION FEE
              </div>
              <div className="text-4xl sm:text-5xl font-cinzel font-black text-white mt-1">
                {formatCurrency(feeCalculation.amount)}
              </div>
              <p className="text-[11px] font-mono-code text-zinc-400 mt-2">
                Arena: <span className="text-white font-bold">{committee.name}</span> ({committee.format})
              </p>
            </div>

            {/* Admin-Configured UPI QR Code */}
            <div className="pt-4 border-t border-white/10 flex flex-col items-center">
              <div className="w-52 h-52 bg-white p-3 rounded-xl border-2 border-red-900/40 shadow-2xl shadow-red-950/40 flex items-center justify-center relative group">
                <img
                  src={appSettings.qr_code_url}
                  alt="UPI Payment QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="mt-4 text-center">
                <span className="text-xs font-mono-code text-zinc-400">UPI ID: </span>
                <span className="text-xs font-mono-code font-bold text-white selection:bg-red-900 px-1.5 py-0.5 bg-black/60 rounded border border-white/10">
                  {appSettings.upi_id}
                </span>
              </div>

              <p className="text-[11px] font-mono-code text-zinc-500 text-center mt-2">
                Scan via Google Pay, PhonePe, Paytm, or BHIM.
              </p>
            </div>
          </div>

          {/* RIGHT: UTR & SCREENSHOT UPLOAD */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 space-y-6">
            <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-red-500" />
              <span>TRANSACTION VERIFICATION</span>
            </h3>

            {/* UTR Input */}
            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-zinc-400 mb-2">
                UTR / Transaction Reference ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 428192830192"
                value={utr}
                onChange={(e) => handleUtrChange(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono-code text-white uppercase placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
              />
              <p className="text-[10px] font-mono-code text-zinc-500 mt-1">
                Enter the 12-digit UPI reference or bank transaction ID.
              </p>
            </div>

            {/* Payment Screenshot File Upload */}
            <div>
              <label className="block text-xs font-mono-code uppercase tracking-wider text-zinc-400 mb-2">
                Payment Screenshot Receipt <span className="text-red-500">*</span>
              </label>

              <div className="relative border-2 border-dashed border-white/15 hover:border-red-600/60 rounded-xl p-4 text-center bg-black/40 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {filePreview ? (
                  <div className="space-y-3">
                    <img
                      src={filePreview}
                      alt="Uploaded Screenshot"
                      className="max-h-40 mx-auto rounded-lg border border-white/10 object-contain"
                    />
                    <div className="inline-flex items-center space-x-1.5 text-xs font-mono-code text-emerald-400">
                      <FileCheck className="w-4 h-4" />
                      <span>Receipt Attached (Click to Replace)</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto group-hover:text-red-400 transition-colors" />
                    <p className="text-xs font-mono-code text-zinc-300">
                      Upload payment screenshot receipt
                    </p>
                    <p className="text-[10px] font-mono-code text-zinc-500">
                      PNG, JPG or WEBP (Max 5MB)
                    </p>
                  </div>
                )}
              </div>

              {localError && (
                <p className="text-xs text-red-500 mt-2 font-mono-code">{localError}</p>
              )}
            </div>

            {/* Security Guarantee Note */}
            <div className="p-3.5 rounded-lg bg-black/60 border border-white/5 space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono-code text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <span>SERVER-VALIDATED INTEGRITY</span>
              </div>
              <p className="text-[10px] font-mono-code text-zinc-500">
                Registration amounts are snapshot server-side against live pricing tables. Receipts are verified by the high command prior to portfolio allocation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation & Submit CTA */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onBack}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-mono-code uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DOSSIER</span>
        </button>

        <button
          type="button"
          disabled={!isFormReady || isSubmitting}
          onClick={onSubmitRegistration}
          className={`w-full sm:w-auto px-10 py-4 rounded-lg font-cinzel font-extrabold tracking-[0.2em] text-sm uppercase transition-all duration-300 shadow-xl ${
            isFormReady && !isSubmitting
              ? 'bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white hover:from-red-600 hover:to-rose-600 shadow-red-950/60 ring-1 ring-red-500 cursor-pointer scale-100 hover:scale-[1.02]'
              : 'bg-zinc-900/60 text-zinc-600 border border-white/[0.05] cursor-not-allowed opacity-50'
          }`}
        >
          {isSubmitting ? 'TRANSMITTING DOSSIER...' : 'SECURE YOUR ENTRY →'}
        </button>
      </div>
    </div>
  );
};
