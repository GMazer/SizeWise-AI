import React, { useState } from 'react';
import { Ruler, Weight, User, CheckCircle2, Loader2, Sparkles, Shirt, ToggleLeft, ToggleRight, ArrowRightLeft } from 'lucide-react';
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

  const [useFullModel, setUseFullModel] = useState(false);
  const [prediction, setPrediction] = useState<SizePrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (id: keyof BodyMeasurements, value: string) => {
    setMeasurements((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const toggleModel = () => {
    setUseFullModel(!useFullModel);
    setPrediction(null);
  };

  const handlePredict = async () => {
    // Validation based on mode
    if (!measurements.height || !measurements.weight) {
      alert("Vui lòng nhập Chiều cao và Cân nặng!");
      return;
    }

    if (useFullModel) {
      if (!measurements.bust || !measurements.waist || !measurements.hips) {
        alert("Vui lòng nhập đủ số đo 3 vòng cho chế độ Chuyên sâu!");
        return;
      }
    }

    setLoading(true);
    setPrediction(null);
    
    try {
      // Logic handled in service (Rule-based calculation + AI Text)
      const result = await predictSizeWithGemini(measurements, useFullModel);
      setPrediction(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <Shirt className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-2">
            SizeWise AI
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            Hệ thống tư vấn size thông minh MAVO
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <User className="w-6 h-6 text-indigo-600" />
                Thông tin cơ thể
              </h2>
              
              <button 
                onClick={toggleModel}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 shadow-sm border ${
                  useFullModel 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {useFullModel ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-indigo-600" />
                    Chế độ: Chuyên sâu
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                    Chế độ: Cơ bản
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                id="height"
                label="Chiều cao"
                unit="cm"
                placeholder="VD: 165"
                value={measurements.height}
                onChange={handleInputChange}
                icon={<Ruler className="w-4 h-4" />}
              />
              <InputField
                id="weight"
                label="Cân nặng"
                unit="kg"
                placeholder="VD: 55"
                value={measurements.weight}
                onChange={handleInputChange}
                icon={<Weight className="w-4 h-4" />}
              />
            </div>

            {/* Conditional Rendering for Full Model inputs */}
            {useFullModel && (
              <div className="mt-8 border-t border-gray-100 pt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide">
                    Số đo 3 vòng <span className="text-red-500 text-xs align-top">*</span>
                  </h3>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    Độ chính xác cao
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <InputField
                    id="bust"
                    label="Vòng 1 (Ngực)"
                    unit="cm"
                    placeholder="VD: 85"
                    value={measurements.bust}
                    onChange={handleInputChange}
                  />
                  <InputField
                    id="waist"
                    label="Vòng 2 (Eo)"
                    unit="cm"
                    placeholder="VD: 68"
                    value={measurements.waist}
                    onChange={handleInputChange}
                  />
                  <InputField
                    id="hips"
                    label="Vòng 3 (Mông)"
                    unit="cm"
                    placeholder="VD: 92"
                    value={measurements.hips}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
            
            {!useFullModel && (
              <div className="mt-6 p-4 bg-blue-50/50 rounded-xl text-sm text-gray-600 border border-blue-100 flex items-start gap-3">
                 <div className="bg-white p-1.5 rounded-full shadow-sm shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                 </div>
                 <p>
                   Chế độ <strong>Cơ bản</strong> sử dụng Chiều cao & Cân nặng. 
                   Nếu bạn có số đo 3 vòng, hãy chuyển sang chế độ <strong>Chuyên sâu</strong> để có kết quả chính xác nhất.
                 </p>
              </div>
            )}

            <div className="mt-10">
              <button
                onClick={handlePredict}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed ${
                  useFullModel 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-200 hover:shadow-indigo-300' 
                    : 'bg-gray-900 hover:bg-black shadow-gray-200'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {useFullModel ? 'Phân Tích Chuyên Sâu' : 'Đoán Size Nhanh'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Section */}
          <div className="lg:col-span-2">
            {!prediction && !loading && (
              <div className="h-full min-h-[300px] bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Ruler className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  {useFullModel ? 'Sẵn sàng phân tích số đo 3 vòng.' : 'Sẵn sàng ước lượng nhanh.'}
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[300px] bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 flex flex-col items-center justify-center animate-pulse">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {useFullModel ? 'Đang chạy Model Full...' : 'Đang chạy Model Basic...'}
                </h3>
                <p className="text-sm text-gray-500 mt-2">Tính toán hiệu số: {(parseFloat(measurements.height || '0') - parseFloat(measurements.weight || '0')).toFixed(1)}</p>
              </div>
            )}

            {prediction && !loading && (
              <div className="h-full bg-white rounded-3xl shadow-xl shadow-gray-100 border border-indigo-100 overflow-hidden relative flex flex-col">
                 <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${useFullModel ? 'from-purple-500 to-pink-500' : 'from-gray-600 to-gray-800'}`} />
                 <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-6 font-semibold uppercase text-xs tracking-wider text-gray-500">
                      <Sparkles className="w-4 h-4" />
                      Kết quả từ {useFullModel ? 'Model Full' : 'Model Basic'}
                    </div>

                    <div className="text-center mb-6">
                      {prediction.isAmbiguous ? (
                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                          <p className="text-sm text-orange-700 font-bold mb-4 flex items-center justify-center gap-2">
                             <ArrowRightLeft className="w-4 h-4" />
                             Phân vân giữa 2 size
                          </p>
                          <div className="flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center">
                              <span className="text-gray-500 text-xs mb-1 font-medium uppercase">Thoải mái</span>
                              <div className="text-4xl font-bold text-gray-900">{prediction.suggestedSize}</div>
                            </div>
                            <div className="h-10 w-px bg-gray-300"></div>
                            <div className="flex flex-col items-center">
                              <span className="text-gray-500 text-xs mb-1 font-medium uppercase">Ôm body</span>
                              <div className="text-4xl font-bold text-gray-900">{prediction.alternativeSize}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                           <p className="text-sm text-gray-500 mb-2 font-medium">Size phù hợp nhất</p>
                           <div className={`inline-block text-white text-6xl font-bold rounded-2xl w-32 h-32 flex items-center justify-center shadow-lg mx-auto ${
                             useFullModel ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200' : 'bg-gray-800 shadow-gray-300'
                           }`}>
                             {prediction.suggestedSize}
                           </div>
                           <p className="mt-3 text-sm font-bold text-green-700 bg-green-50 inline-block px-3 py-1 rounded-full">
                             Độ tin cậy: {Math.round(prediction.confidence)}%
                           </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mt-auto">
                      <div className="bg-indigo-50 rounded-xl p-4">
                         <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            Phân tích chi tiết
                         </h4>
                         <p className="text-gray-700 text-sm leading-relaxed">
                            {prediction.explanation}
                         </p>
                      </div>

                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                         <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-2 text-sm">
                            <Shirt className="w-4 h-4 text-gray-500" />
                            Lời khuyên
                         </h4>
                         <p className="text-gray-600 text-sm leading-relaxed">
                            {prediction.advice}
                         </p>
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 text-center text-gray-400 text-sm">
           © 2024 SizeWise AI. Powered by Google Gemini.
        </div>
      </div>
    </div>
  );
};

export default App;