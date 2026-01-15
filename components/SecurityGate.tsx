
import React, { useState } from 'react';
import { Lock, Key, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface SecurityGateProps {
  onUnlock: () => void;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ onUnlock }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // MẬT KHẨU MẶC ĐỊNH: 123456
  // Bạn có thể thay đổi chuỗi này thành bất cứ gì bạn muốn bảo mật
  const SECRET_CODE = "123456";

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (passcode === SECRET_CODE) {
      // Lưu trạng thái đã đăng nhập vào Session (mất khi tắt tab)
      sessionStorage.setItem('sizeWise_auth', 'true');
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500); // Reset animation rung lắc
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-purple-900/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 shadow-2xl rounded-3xl p-8">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 group transition-transform hover:scale-105 duration-300">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">SizeWise Security</h1>
            <p className="text-gray-400 text-center text-sm">
              Trang web này được bảo vệ. Vui lòng nhập mã khóa để truy cập dữ liệu.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className={`relative transition-transform duration-100 ${shake ? '-translate-x-2' : ''} ${shake ? 'translate-x-2' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key className={`w-5 h-5 ${error ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="password"
                className={`w-full bg-gray-900/50 border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500/20'} text-white text-lg placeholder-gray-500 rounded-xl py-4 pl-12 pr-4 focus:ring-4 outline-none transition-all tracking-widest`}
                placeholder="Nhập mã bảo mật..."
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError(false);
                }}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm justify-center animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4" />
                <span>Mật khẩu không chính xác</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-white text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-white/10"
            >
              <span>Mở khóa hệ thống</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Connection • Admin Access Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};
