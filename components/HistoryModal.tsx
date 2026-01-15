
import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { X, Download, Trash2, Calendar, Ruler, Weight, Filter } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClear: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClear,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Logic lọc danh sách dựa trên ngày chọn
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const itemDate = new Date(item.timestamp);
      // Reset giờ của item về 00:00:00 để so sánh ngày chuẩn xác
      itemDate.setHours(0, 0, 0, 0);

      let isValid = true;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) isValid = false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (itemDate > end) isValid = false;
      }

      return isValid;
    });
  }, [history, startDate, endDate]);

  if (!isOpen) return null;

  const downloadCSV = () => {
    if (filteredHistory.length === 0) return;

    // Định nghĩa header cho CSV
    const headers = [
      "Thời gian",
      "Chiều cao (cm)",
      "Cân nặng (kg)",
      "Vòng 1 (cm)",
      "Vòng 2 (cm)",
      "Vòng 3 (cm)",
      "Size Gợi ý",
      "Size Phụ",
      "Độ tin cậy (%)",
      "Ghi chú"
    ];

    // Tạo các dòng dữ liệu từ danh sách ĐÃ LỌC
    const rows = filteredHistory.map(item => {
      const date = new Date(item.timestamp).toLocaleString('vi-VN');
      const m = item.measurements;
      const p = item.prediction;
      
      return [
        `"${date}"`,
        m.height,
        m.weight,
        m.bust || "-",
        m.waist || "-",
        m.hips || "-",
        p.suggestedSize,
        p.alternativeSize || "-",
        p.confidence,
        `"${p.isAmbiguous ? 'Phân vân size' : 'Chắc chắn'}"`
      ].join(",");
    });

    // Kết hợp header và rows, thêm BOM để Excel đọc đúng tiếng Việt
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    
    // Tạo link tải xuống
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SizeWise_History_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lịch sử Tra cứu</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {history.length > 0 && filteredHistory.length !== history.length 
                ? `Hiển thị ${filteredHistory.length} / ${history.length} kết quả` 
                : `Tổng cộng ${history.length} kết quả`
              }
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
          <div className="flex flex-1 items-center gap-2 w-full">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Từ ngày</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-gray-200 dark:[color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Đến ngày</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-gray-200 dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={clearFilter}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium whitespace-nowrap self-end sm:self-center mb-1.5 sm:mb-0"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Content - Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50 dark:bg-gray-950/50">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
              <Calendar className="w-12 h-12 mb-3 opacity-20" />
              <p>
                {history.length === 0 
                  ? "Chưa có lịch sử tra cứu nào." 
                  : "Không tìm thấy kết quả nào trong khoảng thời gian này."}
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleString('vi-VN')}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5" />
                        <span>{item.measurements.height}cm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Weight className="w-3.5 h-3.5" />
                        <span>{item.measurements.weight}kg</span>
                      </div>
                      {(item.measurements.bust || item.measurements.waist || item.measurements.hips) && (
                         <span className="text-gray-400 dark:text-gray-600 text-xs self-center">
                           (3 vòng: {item.measurements.bust || '-'}/{item.measurements.waist || '-'}/{item.measurements.hips || '-'})
                         </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Result */}
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="text-right">
                       <div className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase">Size Gợi ý</div>
                       <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          {item.prediction.suggestedSize}
                       </div>
                    </div>
                    {item.prediction.isAmbiguous && (
                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    )}
                    {item.prediction.isAmbiguous && (
                        <div className="text-left">
                           <div className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase">Tham khảo</div>
                           <div className="text-xl font-bold text-gray-500 dark:text-gray-400">
                              {item.prediction.alternativeSize}
                           </div>
                        </div>
                    )}
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl flex justify-between items-center gap-4">
          <button
            onClick={onClear}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Xóa tất cả</span>
          </button>

          <button
            onClick={downloadCSV}
            disabled={filteredHistory.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-xl shadow-lg shadow-gray-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Xuất file CSV {filteredHistory.length !== history.length ? '(Đã lọc)' : ''}
          </button>
        </div>

      </div>
    </div>
  );
};
