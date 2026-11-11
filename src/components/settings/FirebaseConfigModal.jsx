import React from 'react';
import { isFirebaseConfigured } from '../../services/firebase.js';
import { X, Cloud, Database, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

export default function FirebaseConfigModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-plum-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-brand-plum-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-brand-plum-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-plum-800 rounded-xl text-brand-rose-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit']">Database & Cloud Sync Status</h3>
              <p className="text-xs text-brand-plum-200">Firebase Firestore and Local Ledger state</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-brand-plum-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-brand-plum-900">
          {/* Status Box */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${isFirebaseConfigured ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            {isFirebaseConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">
                {isFirebaseConfigured ? 'Firebase Cloud Connected' : 'Local Ledger Engine Active'}
              </p>
              <p className="mt-1 leading-relaxed">
                {isFirebaseConfigured
                  ? 'All records and stock transactions are synchronizing directly with your Cloud Firestore and Firebase Storage instances.'
                  : 'Currently operating in browser-persistent Local Ledger Mode. Every screen, calculation, stock movement, batch production, and invoice PDF generator is 100% functional with full persistence.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-brand-plum-950 uppercase tracking-wider text-[11px]">
              How to connect your Firebase Project:
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-brand-plum-700 leading-relaxed">
              <li>Open your <code>.env</code> file in the project root (see <code>.env.example</code>).</li>
              <li>Provide your Firebase credentials:
                <pre className="bg-brand-cream-100 p-2.5 rounded-lg border border-brand-plum-200 text-[11px] font-mono text-brand-plum-950 my-1.5 overflow-x-auto">
{`Project ID: crochet-business-manager
Auth Domain: crochet-business-manager.firebaseapp.com
Storage Bucket: crochet-business-manager.firebasestorage.app`}
                </pre>
              </li>
              <li>Deploy security rules with Firebase CLI: <code>firebase deploy --only firestore:rules,storage:rules</code></li>
            </ol>
          </div>

          <div className="p-3 bg-brand-cream-50 rounded-xl border border-brand-plum-100 flex items-center justify-between">
            <span className="text-brand-plum-600">Schema version:</span>
            <span className="font-bold font-mono">businesses/{'{businessId}'}/v1.0</span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-plum-900 hover:bg-brand-plum-950 rounded-xl transition"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
