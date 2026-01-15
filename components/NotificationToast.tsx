
import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationToastProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Tự động tắt sau 5s
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      border: "border-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
      title: "Thành công"
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      border: "border-red-500",
      bg: "bg-red-50 dark:bg-red-900/20",
      title: "Lỗi"
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
      border: "border-orange-500",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      title: "Lưu ý"
    },
    info: {
      icon: <Info className="w-5 h-5 text-indigo-500" />,
      border: "border-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      title: "Thông tin"
    }
  };

  const currentStyle = styles[type];

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5 duration-300">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border-l-4 ${currentStyle.border} ${currentStyle.bg} bg-white dark:bg-gray-800 border-y border-r border-gray-100 dark:border-gray-700 max-w-md w-full backdrop-blur-sm`}>
        <div className="shrink-0 mt-0.5">
          {currentStyle.icon}
        </div>
        <div className="flex-1 mr-2">
          <h4 className={`text-sm font-bold ${type === 'error' ? 'text-red-600 dark:text-red-400' : type === 'warning' ? 'text-orange-600 dark:text-orange-400' : type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {currentStyle.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-snug">
            {message}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
