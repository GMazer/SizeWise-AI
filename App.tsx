
import React, { useState, useEffect } from 'react';
import { Ruler, Weight, User, CheckCircle2, Loader2, Sparkles, Shirt, ArrowRightLeft, Eraser, Moon, Sun, History, HelpCircle, LogOut } from 'lucide-react';
import { InputField } from './components/InputField';
import { BodyMeasurements, SizePrediction, HistoryItem } from './types';
import { predictSizeWithGemini } from './services/geminiService';
import { HistoryModal } from './components/HistoryModal';
import { TutorialModal } from './components/TutorialModal';
import { NotificationToast, NotificationType } from './components/NotificationToast';
import { SecurityGate } from './components/SecurityGate';

const App: React.FC = () => {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check session storage on mount
  useEffect(() => {
    const auth = sessionStorage.getItem('sizeWise_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('sizeWise_auth');
    setIsAuthenticated(false);
  };

  // --- APP STATE ---
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: '',
    weight: '',
    bust: '',
    waist: '',
    hips: '',
  });

  const [prediction, setPrediction] = useState<SizePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: NotificationType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showNotification = (message: string, type: NotificationType = 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Load history & Check tutorial seen from localStorage on mount (Only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return; // Chỉ load dữ liệu khi đã đăng nhập

    // Load History
    const savedHistory = localStorage.getItem('sizeWiseHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // Check Tutorial
    const hasSeenTutorial = localStorage.getItem('sizeWiseTutorialSeen');
    if (!hasSeenTutorial) {
      // Delay slightly for better UX
      const timer = setTimeout(() => {
        setIsTutorialOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    localStorage.setItem('sizeWiseTutorialSeen', 'true');
  };

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('sizeWiseHistory', JSON.stringify(history));
    }
  }, [history, isAuthenticated]);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleInputChange = (id: keyof BodyMeasurements, value: string) => {
    setMeasurements((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleClear = () => {
    setMeasurements({
      height: '',
      weight: '',
      bust: '',
      waist: '',
      hips: '',
    });
    setPrediction(null);
    showNotification("Đã làm mới dữ liệu đầu vào", 'info');
  };

  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử?")) {
      setHistory([]);
      showNotification("Đã xóa toàn bộ lịch sử tra cứu", 'success');
      setIsHistoryOpen(false);
    }
  };

  // --- MAGIC PASTE FEATURE ---
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Lấy nội dung từ clipboard
    const clipboardData = e.clipboardData.getData('text');
    
    // Sử dụng Regex để tìm các số (nguyên hoặc thập phân) trong chuỗi
    // Ví dụ: "1m65 55kg" -> ["1", "65", "55"] => Cần regex thông minh hơn hoặc logic xử lý đơn giản
    // Logic đơn giản: Lấy tất cả các cụm số, bỏ qua các ký tự không phải số
    // Hỗ trợ số thập phân với dấu chấm
    const numbers = clipboardData.match(/(\d+(\.\d+)?)/g);

    if (numbers && numbers.length >= 2) {
      e.preventDefault(); // Ngăn hành vi paste mặc định (tránh paste cả chuỗi dài vào 1 ô)
      
      // Map theo thứ tự: Height -> Weight -> Bust -> Waist -> Hips
      // Nếu số đo quá nhỏ (ví dụ < 3 cho chiều cao mét), có thể cần logic chuẩn hóa (nhưng ở đây giữ nguyên)
      
      const newMeasurements = { ...measurements };
      const fields: (keyof BodyMeasurements)[] = ['height', 'weight', 'bust', 'waist', 'hips'];

      numbers.forEach((num, index) => {
        if (index < fields.length) {
          newMeasurements[fields[index]] = num;
        }
      });

      setMeasurements(newMeasurements);
      showNotification(`Đã tự động điền ${Math.min(numbers.length, 5)} chỉ số từ bộ nhớ đệm`, 'success');
    }
    // Nếu chỉ có 1 số, để trình duyệt xử lý paste bình thường vào ô đó
  };

  const handlePredict = async () => {
    if (!measurements.height || !measurements.weight) {
      showNotification("Vui lòng nhập Chiều cao và Cân nặng!", 'error');
      return;
    }

    // Logic cũ bắt buộc nhập đủ 3 vòng đã được xóa bỏ theo yêu cầu mới
    // API backend mới chấp nhận các giá trị null
    
    // Xác định xem có dùng model full (có ít nhất 1 số đo phụ) hay không để hiển thị UI
    const useFullModel = !!(measurements.bust || measurements.waist || measurements.hips);

    setLoading(true);
    setPrediction(null);
    
    try {
      const result = await predictSizeWithGemini(measurements, useFullModel);
      setPrediction(result);

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        measurements: { ...measurements },
        prediction: result
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      
      showNotification("Đã tìm thấy size phù hợp với bạn!", 'success');

    } catch (error) {
      console.error(error);
      showNotification("Có lỗi xảy ra khi kết nối. Vui lòng thử lại.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to dynamically calculate font size class based on text length
  const getSizeFontSize = (text: string) => {
    if (text.length <= 2) return "text-7xl";
    if (text.length <= 4) return "text-5xl";
    if (text.length <= 8) return "text-3xl";
    return "text-2xl";
  };

  // --- SECURITY CHECK RENDER ---
  if (!isAuthenticated) {
    return <SecurityGate onUnlock={() => setIsAuthenticated(true)} />;
  }

  // --- MAIN APP RENDER ---
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      
      <NotificationToast 
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />

      <div className="max-w-4xl mx-auto relative">
        
        {/* Top Actions */}
        <div className="absolute top-0 right-0 flex items-center gap-2">
           <button
            onClick={() => setIsTutorialOpen(true)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all focus:outline-none"
            title="Hướng dẫn sử dụng"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

           <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus:outline-none"
            title="Xem lịch sử"
          >
            <History className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-yellow-400 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus:outline-none"
            title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-white dark:bg-gray-800 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all focus:outline-none ml-2"
            title="Khóa lại"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-10 pt-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm transition-colors">
              <Shirt className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl mb-2 transition-colors">
            SizeWise AI
          </h1>
          <p className="text-gray-500 dark:text-gray-400 transition-colors">
            Một sản phẩm được phát triển bởi Hyle với thuật toán Random Forest
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 transition-colors">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Thông tin cơ thể
              </h2>
              
              <button 
                onClick={handleClear}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Xóa tất cả dữ liệu"
              >
                <Eraser className="w-4 h-4" />
                Làm mới
              </button>
            </div>
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <InputField
                id="height"
                label="Chiều cao"
                unit="cm"
                placeholder="165"
                value={measurements.height}
                onChange={handleInputChange}
                icon={<Ruler className="w-4 h-4" />}
                nextField="weight"
                onPaste={handlePaste}
              />
              <InputField
                id="weight"
                label="Cân nặng"
                unit="kg"
                placeholder="55"
                value={measurements.weight}
                onChange={handleInputChange}
                icon={<Weight className="w-4 h-4" />}
                nextField="bust"
                onPaste={handlePaste}
              />
            </div>

            {/* 3 Measurements Info */}
            <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2 transition-colors">
                    Số đo 3 vòng
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500 normal-case bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 transition-colors">
                      Tùy chọn
                    </span>
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <InputField
                    id="bust"
                    label="Vòng 1 (Ngực)"
                    unit="cm"
                    placeholder="85"
                    value={measurements.bust}
                    onChange={handleInputChange}
                    nextField="waist"
                    onPaste={handlePaste}
                  />
                  <InputField
                    id="waist"
                    label="Vòng 2 (Eo)"
                    unit="cm"
                    placeholder="68"
                    value={measurements.waist}
                    onChange={handleInputChange}
                    nextField="hips"
                    onPaste={handlePaste}
                  />
                  <InputField
                    id="hips"
                    label="Vòng 3 (Mông)"
                    unit="cm"
                    placeholder="92"
                    value={measurements.hips}
                    onChange={handleInputChange}
                    nextField="predict-btn"
                    onPaste={handlePaste}
                  />
                </div>
                <div className="mt-4 flex items-start gap-2">
                    <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight transition-colors">
                        Mẹo: Bạn có thể nhập 1 trong 3 vòng hoặc để trống. Copy chuỗi số (ví dụ: "1m65 55kg 85") và dán để điền nhanh!
                    </p>
                </div>
            </div>

            <div className="mt-8">
              <button
                id="predict-btn"
                onClick={handlePredict}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-600 dark:to-indigo-800 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none focus:ring-4 focus:ring-indigo-500/30 outline-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tính toán...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Phân tích & Tìm Size
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Section */}
          <div className="lg:col-span-2">
            {!prediction && !loading && (
              <div className="h-full min-h-[200px] lg:min-h-[400px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-sm transition-colors">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700 transition-colors">
                  <Ruler className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-400 dark:text-gray-500 text-sm font-medium px-8 transition-colors">
                  Kết quả size và lời khuyên chi tiết sẽ hiển thị tại đây sau khi bạn cung cấp đủ dữ liệu cơ thể.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center justify-center animate-pulse transition-colors">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
                <h3 className="text-gray-800 dark:text-gray-200 font-semibold transition-colors">Đang kết nối AI...</h3>
              </div>
            )}

            {prediction && !loading && (
              <div className="h-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-indigo-100/50 dark:shadow-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 overflow-hidden relative flex flex-col animate-in slide-in-from-bottom-4 duration-500 transition-colors">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                 <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <div className="flex items-center justify-center gap-2 mb-6">
                       <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 transition-colors">
                          AI Mode: Tự động
                       </span>
                    </div>

                    <div className="text-center mb-8">
                      {prediction.isAmbiguous ? (
                        <div className="relative">
                           <div className="flex items-center justify-center mb-4">
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-100 dark:border-orange-900/30">
                                 <ArrowRightLeft className="w-3 h-3" />
                                 Phân vân size
                              </span>
                           </div>

                           <div className="flex items-center justify-center gap-2 sm:gap-4">
                              {/* Suggested Size */}
                              <div className="flex-1 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 text-center shadow-lg shadow-indigo-200 dark:shadow-none transform transition hover:scale-[1.02]">
                                  <div className="text-indigo-100 text-[10px] font-bold uppercase tracking-wide mb-1 opacity-90">Ưu tiên</div>
                                  <div className="text-5xl sm:text-6xl font-black text-white">{prediction.suggestedSize}</div>
                                  <div className="text-indigo-100 text-[10px] mt-1 font-medium">Vừa vặn nhất</div>
                              </div>

                              {/* VS Badge */}
                              <div className="flex flex-col items-center z-10 -mx-3 sm:mx-0">
                                 <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-indigo-50 dark:border-gray-700 flex items-center justify-center shadow-sm">
                                     <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">VS</span>
                                 </div>
                              </div>

                              {/* Alternative Size */}
                              <div className="flex-1 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-default">
                                  <div className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1">Tham khảo</div>
                                  <div className="text-5xl sm:text-6xl font-black text-gray-700 dark:text-gray-200">{prediction.alternativeSize}</div>
                                  <div className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-medium">Size thay thế</div>
                              </div>
                           </div>
                           
                           <div className="mt-4 text-center">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-lg">
                                Độ tin cậy: <span className={`${prediction.confidence < 80 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-white'} font-bold`}>{Math.round(prediction.confidence)}%</span>
                              </span>
                           </div>
                        </div>
                      ) : (
                        <div>
                           <div className="relative inline-block">
                             <div className={`text-white ${getSizeFontSize(prediction.suggestedSize)} font-black rounded-3xl w-36 h-36 flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 bg-gradient-to-br from-indigo-600 to-purple-600 mx-auto transform transition-transform hover:scale-105 duration-300 overflow-hidden px-2 break-words`}>
                               {prediction.suggestedSize}
                             </div>
                             <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-md border whitespace-nowrap transition-colors ${prediction.confidence < 80 ? 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' : 'text-indigo-600 dark:text-indigo-400 border-indigo-50 dark:border-gray-700'}`}>
                                Độ tin cậy {Math.round(prediction.confidence)}%
                             </div>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mt-auto">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 transition-colors">
                         <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-2 text-sm transition-colors">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Tại sao chọn size này?
                         </h4>
                         <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed text-justify transition-colors">
                            {prediction.explanation}
                         </p>
                      </div>

                      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 transition-colors">
                         <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-2 text-sm transition-colors">
                            <Shirt className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                            Lời khuyên từ Stylist
                         </h4>
                         <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed text-justify transition-colors">
                            {prediction.advice}
                         </p>
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 text-center text-gray-400 dark:text-gray-600 text-xs font-medium transition-colors">
           © 2026 SizeWise AI. Powered by Hyle.
        </div>
      </div>

      {/* History Modal */}
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onClear={handleClearHistory}
      />
      
      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
      />
    </div>
  );
};

export default App;
