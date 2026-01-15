
import React, { useState, useEffect } from 'react';
import { Ruler, Weight, User, CheckCircle2, Loader2, Sparkles, Shirt, ArrowRightLeft, Eraser, Moon, Sun } from 'lucide-react';
import { InputField } from './components/InputField';
import { BodyMeasurements, SizePrediction } from './types';
import { predictSizeWithGemini } from './services/geminiService';

const App: React.FC = () => {
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: '',
    weight: '',
    bust: '',
    waist: '',
    hips: '',
  });

  const [prediction, setPrediction] = useState<SizePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check system preference on initial load
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to html element
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
  };

  const handlePredict = async () => {
    if (!measurements.height || !measurements.weight) {
      alert("Vui lòng nhập Chiều cao và Cân nặng!");
      return;
    }

    const hasAny3Vong = measurements.bust || measurements.waist || measurements.hips;
    const hasAll3Vong = measurements.bust && measurements.waist && measurements.hips;

    if (hasAny3Vong && !hasAll3Vong) {
      alert("Nếu bạn nhập số đo 3 vòng, vui lòng nhập đầy đủ cả 3 (Ngực, Eo, Mông) để có kết quả chính xác, hoặc để trống tất cả.");
      return;
    }

    const useFullModel = !!hasAll3Vong;

    setLoading(true);
    setPrediction(null);
    
    try {
      const result = await predictSizeWithGemini(measurements, useFullModel);
      setPrediction(result);
    } catch (error) {
      console.error(error);
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

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto relative">
        
        {/* Theme Toggle Button - Absolute Top Right */}
        <button
          onClick={toggleTheme}
          className="absolute top-0 right-0 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-yellow-400 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus:outline-none"
          title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

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
              />
              <InputField
                id="weight"
                label="Cân nặng"
                unit="kg"
                placeholder="55"
                value={measurements.weight}
                onChange={handleInputChange}
                icon={<Weight className="w-4 h-4" />}
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
                  />
                  <InputField
                    id="waist"
                    label="Vòng 2 (Eo)"
                    unit="cm"
                    placeholder="68"
                    value={measurements.waist}
                    onChange={handleInputChange}
                  />
                  <InputField
                    id="hips"
                    label="Vòng 3 (Mông)"
                    unit="cm"
                    placeholder="92"
                    value={measurements.hips}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mt-4 flex items-start gap-2">
                    <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight transition-colors">
                        Nếu điền, vui lòng <strong>điền đủ cả 3 ô</strong> để kích hoạt AI Chuyên sâu với độ chính xác cao hơn.
                    </p>
                </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handlePredict}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-600 dark:to-indigo-800 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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
                          {measurements.bust ? 'AI Mode: Chuyên sâu' : 'AI Mode: Cơ bản'}
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
                                Độ tin cậy: <span className="text-gray-800 dark:text-white font-bold">{Math.round(prediction.confidence)}%</span>
                              </span>
                           </div>
                        </div>
                      ) : (
                        <div>
                           <div className="relative inline-block">
                             <div className={`text-white ${getSizeFontSize(prediction.suggestedSize)} font-black rounded-3xl w-36 h-36 flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 bg-gradient-to-br from-indigo-600 to-purple-600 mx-auto transform transition-transform hover:scale-105 duration-300 overflow-hidden px-2 break-words`}>
                               {prediction.suggestedSize}
                             </div>
                             <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3 py-1 rounded-full shadow-md border border-indigo-50 dark:border-gray-700 whitespace-nowrap transition-colors">
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
    </div>
  );
};

export default App;
