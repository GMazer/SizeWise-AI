
import React from 'react';
import { X, Ruler, Sparkles, Shirt, Info, ArrowRight } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: <Ruler className="w-6 h-6 text-blue-500" />,
      title: "Nhập thông tin cơ bản",
      description: "Nhập Chiều cao và Cân nặng của bạn. Đây là 2 chỉ số bắt buộc để AI tính toán."
    },
    {
      icon: <Shirt className="w-6 h-6 text-purple-500" />,
      title: "Số đo 3 vòng (Tùy chọn)",
      description: "Để có kết quả chính xác nhất, hãy nhập thêm số đo Ngực, Eo, Mông. Nếu không nhớ, bạn có thể bỏ qua."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-indigo-500" />,
      title: "Bấm 'Phân tích & Tìm Size'",
      description: "Hệ thống AI sẽ phân tích dữ liệu và đưa ra size phù hợp nhất cùng lời khuyên phối đồ."
    },
    {
      icon: <Info className="w-6 h-6 text-green-500" />,
      title: "Xem kết quả & Lịch sử",
      description: "Xem size gợi ý, lời giải thích chi tiết và xem lại lịch sử tra cứu của bạn bất cứ lúc nào."
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
            <div className="absolute top-4 right-4">
                <button 
                    onClick={onClose}
                    className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="text-center text-white p-6">
                <h2 className="text-2xl font-bold mb-1">Chào mừng bạn!</h2>
                <p className="text-indigo-100 text-sm">Hướng dẫn nhanh cách sử dụng SizeWise AI</p>
            </div>
            {/* Decoration circles */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute top-0 right-10 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white dark:bg-gray-900">
            <div className="space-y-6">
                {steps.map((step, index) => (
                    <div key={index} className="flex gap-4 items-start group">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-gray-100 dark:border-gray-700 shadow-sm">
                            {step.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {index + 1}. {step.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button 
                    onClick={onClose}
                    className="w-full py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                    <span>Bắt đầu ngay</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
