import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { hideSnackbar, type SnackbarNotification } from '../../store/slices/notificationSlice';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const SnackbarItem: React.FC<{ notification: SnackbarNotification }> = ({ notification }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        dispatch(hideSnackbar(notification.id));
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification, dispatch]);

  const getStyle = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-emerald-900/90 border-emerald-500/40 text-white',
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />,
          pill: 'bg-emerald-800 text-emerald-200',
        };
      case 'error':
        return {
          bg: 'bg-rose-950/95 border-rose-500/40 text-white',
          icon: <AlertCircle className="h-4 w-4 text-rose-300 shrink-0" />,
          pill: 'bg-rose-900 text-rose-200',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 border-amber-500/40 text-white',
          icon: <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0" />,
          pill: 'bg-amber-900 text-amber-200',
        };
      case 'info':
      default:
        return {
          bg: 'bg-indigo-950/90 border-indigo-500/40 text-white',
          icon: <Info className="h-4 w-4 text-indigo-300 shrink-0" />,
          pill: 'bg-indigo-900 text-indigo-200',
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${style.bg} max-w-md w-full`}
    >
      {style.icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {notification.statusCode !== undefined && notification.statusCode > 0 && (
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${style.pill}`}>
              HTTP {notification.statusCode}
            </span>
          )}
        </div>
        <p className="text-xs font-medium leading-relaxed mt-0.5 break-words">
          {notification.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => dispatch(hideSnackbar(notification.id))}
        className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const SnackbarContainer: React.FC = () => {
  const notifications = useAppSelector((state) => state.notification.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-auto">
      {notifications.map((n) => (
        <SnackbarItem key={n.id} notification={n} />
      ))}
    </div>
  );
};

