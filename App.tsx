import React, { useState } from 'react';
import { Ruler, Weight, User, CheckCircle2, Loader2, Sparkles, Shirt, ArrowRightLeft, RefreshCcw, Eraser } from 'lucide-react';
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
    // 1. Validation: Chiều cao & Cân nặng bắt buộc
    if (!measurements.height || !measurements.weight) {
      alert("Vui lòng nhập Chiều cao và Cân nặng!");
      return;
    }

    // 2. Logic: Kiểm tra số đo 3 vòng
    const hasAny3Vong = measurements.bust || measurements.waist || measurements.hips;
    const hasAll3Vong = measurements.bust && measurements.waist && measurements.hips;

    // Nếu nhập 1 trong 3 vòng thì bắt buộc phải nhập hết
    if (hasAny3Vong && !hasAll3Vong) {
      alert("Nếu bạn nhập số đo 3 vòng, vui lòng nhập đầy đủ cả 3 (Ngực, Eo, Mông) để có kết quả chính xác, hoặc để trống tất cả.");
      return;
    }

    // Quyết định dùng model nào: Nếu có đủ 3 vòng -> Full Model, ngược lại -> Basic
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

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <Shirt className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl mb-2">
            SizeWise AI
          </h1>
          <p className="text-gray-500">
            Một sản phẩm được phát triển bởi Hyle với thuật toán Random Forest
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Thông tin cơ thể
              </h2>
              
              <button 
                onClick={handleClear}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50"
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
            <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    Số đo 3 vòng
                    <span className="text-xs font-normal text-gray-400 normal-case bg-white px-2 py-0.5 rounded border border-gray-200">
                      Tùy chọn
                    </span>
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                <div className="mt-3 flex items-start gap-2">
                    <Sparkles className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500 leading-tight">
                        Nếu điền, vui lòng <strong>điền đủ cả 3 ô</strong> để kích hoạt AI Chuyên sâu với độ chính xác cao hơn.
                    </p>
                </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handlePredict}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg shadow-indigo-200 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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
              <div className="h-full min-h-[200px] lg:min-h-[400px] bg-white border border-gray-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                  <Ruler className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm font-medium px-8">
                  Kết quả size và lời khuyên chi tiết sẽ hiển thị tại đây sau khi bạn điền đầy đủ thông tin.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] bg-white rounded-3xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
                <h3 className="text-gray-800 font-semibold">Đang kết nối AI...</h3>
              </div>
            )}

            {prediction && !loading && (
              <div className="h-full bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-100 overflow-hidden relative flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                 <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <div className="flex items-center justify-center gap-2 mb-6">
                       <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-100">
                          {measurements.bust ? 'AI Mode: Chuyên sâu' : 'AI Mode: Cơ bản'}
                       </span>
                    </div>

                    <div className="text-center mb-8">
                      {prediction.isAmbiguous ? (
                        <div className="bg-orange-50/80 p-5 rounded-2xl border border-orange-100">
                          <p className="text-xs text-orange-600 font-bold mb-3 flex items-center justify-center gap-1 uppercase tracking-wide">
                             <ArrowRightLeft className="w-3 h-3" />
                             Phân vân giữa 2 size
                          </p>
                          <div className="flex items-center justify-center gap-8">
                            <div className="flex flex-col items-center">
                              <span className="text-gray-400 text-[10px] mb-1 font-bold uppercase tracking-wide">Thoải mái</span>
                              <div className="text-4xl font-black text-gray-800">{prediction.suggestedSize}</div>
                            </div>
                            <div className="h-8 w-px bg-gray-300/50"></div>
                            <div className="flex flex-col items-center">
                              <span className="text-gray-400 text-[10px] mb-1 font-bold uppercase tracking-wide">Ôm body</span>
                              <div className="text-4xl font-black text-gray-800">{prediction.alternativeSize}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                           <div className="relative inline-block">
                             <div className="text-white text-7xl font-black rounded-3xl w-36 h-36 flex items-center justify-center shadow-xl shadow-indigo-200 bg-gradient-to-br from-indigo-600 to-purple-600 mx-auto transform transition-transform hover:scale-105 duration-300">
                               {prediction.suggestedSize}
                             </div>
                             <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow-md border border-indigo-50 whitespace-nowrap">
                                Độ tin cậy {Math.round(prediction.confidence)}%
                             </div>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mt-auto">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                         <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Tại sao chọn size này?
                         </h4>
                         <p className="text-gray-600 text-sm leading-relaxed text-justify">
                            {prediction.explanation}
                         </p>
                      </div>

                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                         <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-2 text-sm">
                            <Shirt className="w-4 h-4 text-indigo-500" />
                            Lời khuyên từ Stylist
                         </h4>
                         <p className="text-gray-600 text-sm leading-relaxed text-justify">
                            {prediction.advice}
                         </p>
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 text-center text-gray-400 text-xs font-medium">
           © 2026 SizeWise AI. Powered by Hyle.
        </div>
      </div>
    </div>
  );
};

export default App;