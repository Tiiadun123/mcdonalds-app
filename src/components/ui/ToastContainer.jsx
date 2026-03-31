import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
          error: <AlertCircle className="w-5 h-5 text-red-500" />,
          info: <Info className="w-5 h-5 text-blue-500" />
        };
        const bgColors = {
          success: 'bg-emerald-50 border-emerald-100',
          error: 'bg-red-50 border-red-100',
          info: 'bg-blue-50 border-blue-100'
        };

        return (
          <div
            key={toast.id}
            role="alert"
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl animate-slide-in-right ${bgColors[toast.type] || bgColors.info}`}
          >
            {icons[toast.type] || icons.info}
            <p className="text-sm font-semibold text-slate-800 break-words">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
