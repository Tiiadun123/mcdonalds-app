import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../lib/authService';
import { Lock, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Không thể cập nhật mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-yellow/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="inline-flex items-center text-gray-400 hover:text-primary-red transition-all group px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-white">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-black uppercase text-[10px] tracking-widest">McHome</span>
          </Link>
          <Link to="/catalog" className="inline-flex items-center text-gray-400 hover:text-gray-900 transition-all px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-white font-black uppercase text-[10px] tracking-widest">
            Menu
          </Link>
        </div>
        <h2 className="text-center text-4xl font-black text-gray-900 tracking-tight">Đặt lại mật khẩu</h2>
        <p className="mt-2 text-center text-gray-500 font-medium italic">
          Hãy chọn một mật khẩu mới thật bảo mật nhé!
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/70 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-[2.5rem] sm:px-10 border border-white/40">
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-primary-red text-primary-red rounded-xl text-sm font-bold flex items-center">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-xl text-sm font-bold flex items-center">
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              Mật khẩu đã được cập nhật thành công! Đang chuyển hướng về trang đăng nhập...
            </div>
          )}

          {!success && (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">Mật khẩu mới</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-red">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl
                             focus:bg-white focus:border-primary-yellow/50 focus:ring-4 focus:ring-primary-yellow/10
                             outline-none transition-all duration-300 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">Xác nhận mật khẩu</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-red">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl
                             focus:bg-white focus:border-primary-yellow/50 focus:ring-4 focus:ring-primary-yellow/10
                             outline-none transition-all duration-300 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-4 px-4 border border-transparent 
                           rounded-2xl shadow-lg shadow-primary-red/20 text-md font-black text-white 
                           bg-primary-red hover:bg-red-700 focus:outline-none transition-all duration-300"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'CẬP NHẬT MẬT KHẨU'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
