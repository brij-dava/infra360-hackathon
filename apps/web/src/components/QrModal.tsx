import React, { useEffect, useState } from 'react';
import { ApiClient } from '../lib/api';
import { QrCode, Copy, Check, ExternalLink, X } from 'lucide-react';

interface QrModalProps {
  assetTag: string | null;
  assetName?: string;
  onClose: () => void;
  onOpenScanner?: (assetTag: string) => void;
}

export const QrModal: React.FC<QrModalProps> = ({ assetTag, assetName, onClose, onOpenScanner }) => {
  const [qrData, setQrData] = useState<{ scanUrl: string; dataUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetTag) return;
    setLoading(true);
    ApiClient.getAssetQr(assetTag)
      .then((data) => {
        setQrData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [assetTag]);

  if (!assetTag) return null;

  const handleCopy = () => {
    if (qrData?.scanUrl) {
      navigator.clipboard.writeText(qrData.scanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-100">Physical-to-Digital Asset Twin</h3>
        <p className="text-xs text-slate-400 font-mono mt-0.5">{assetTag}</p>
        {assetName && <p className="text-xs text-slate-300 font-medium mt-1 truncate">{assetName}</p>}

        {/* QR Display */}
        <div className="my-5 p-4 bg-white rounded-2xl inline-block shadow-inner">
          {loading ? (
            <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
              Generating High-Density Code...
            </div>
          ) : qrData ? (
            <img src={qrData.dataUrl} alt={`QR Code for ${assetTag}`} className="w-52 h-52 object-contain" />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-rose-500 text-xs">
              Failed to generate QR
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mb-4 px-2">
          Affix this cryptographic QR code to the physical chassis rack unit. Scanning with any smartphone immediately opens the field diagnostic twin.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'URL Copied!' : 'Copy Deep Link'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenScanner) onOpenScanner(assetTag);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Launch Field Twin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
