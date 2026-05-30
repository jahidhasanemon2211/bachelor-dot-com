import toast from 'react-hot-toast';
import React from 'react';

export const confirmAction = (message: string, onConfirm: () => void) => {
  toast.custom(
    (t) => (
      <div className="bg-white p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-100 min-w-[250px] animate-enter">
        <p className="text-sm font-bold text-slate-800 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            বাতিল
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
            className="px-3 py-1.5 text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
          >
            হ্যাঁ, মুছুন
          </button>
        </div>
      </div>
    ),
    { duration: 8000, position: 'top-center' }
  );
};
