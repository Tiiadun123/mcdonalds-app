import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { authService } from '../lib/authService';
import { AlertTriangle, CheckCircle, LogIn, UserPlus, Mail, Lock, User, Loader2, ArrowLeft, MailQuestion, Star } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();
  const signIn = useAuthStore(state => state.signIn);
  const addToast = useToastStore(state => state.addToast);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const result = await signIn(email, password);
        if (!result.success) throw result.error;
        addToast('Đăng nhập thành công! Chào mừng trở lại.', 'success');
        navigate('/');
      } else {
        await authService.signUp(email, password, fullName);
        setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
        addToast('Đăng ký thành công!', 'success');
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      addToast(err.message || 'Xác thực thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Vui lòng nhập email của bạn trước.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setMessage('Link khôi phục mật khẩu đã được gửi đến email của bạn.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden animate-mc-entry">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-yellow/10 rounded-full blur-[120px] animate-float-soft"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-red/5 rounded-full blur-[100px] animate-float-soft [animation-delay:1.1s]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-[15%] w-12 h-12 bg-white/40 backdrop-blur-xl border border-white/20 rounded-2xl rotate-12 animate-float-soft opacity-50 hidden lg:block"></div>
      <div className="absolute bottom-40 right-[15%] w-16 h-16 bg-white/40 backdrop-blur-xl border border-white/20 rounded-[2rem] -rotate-12 animate-float-soft [animation-delay:0.6s] opacity-50 hidden lg:block"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center gap-3 mb-10 animate-fade-in-down animate-stagger-1">
          <Link to="/" className="inline-flex items-center text-gray-400 hover:text-primary-red transition-colors group px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-white hover:shadow-md hover:-translate-y-0.5">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-display font-black uppercase text-[10px] tracking-widest">McHome</span>
          </Link>
          <Link to="/catalog" className="inline-flex items-center text-gray-400 hover:text-gray-900 transition-colors px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-white font-display font-black uppercase text-[10px] tracking-widest hover:shadow-md hover:-translate-y-0.5">
            Menu
          </Link>
        </div>
        
        <div className="flex justify-center mb-8 animate-scale-in animate-stagger-2">
          <div className="w-24 h-24 bg-primary-red rounded-[2.5rem] flex items-center justify-center shadow-mc transform hover:scale-105 hover:rotate-3 transition-[transform] duration-300 cursor-pointer border-4 border-white">
             <span className="text-white text-6xl font-display font-black italic tracking-tighter">M</span>
          </div>
        </div>
        
        <div className="text-center space-y-2 mb-10 animate-fade-in-up animate-stagger-2">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-red/5 rounded-full text-primary-red">
              <Star className="w-4 h-4 fill-primary-red" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Member Access</span>
           </div>
           <h2 className="text-5xl font-display font-black text-gray-900 tracking-tighter uppercase">
             {isLogin ? 'Welcome Back' : 'Join McPro'}
           </h2>
           <p className="text-gray-400 font-medium text-lg">
             {isLogin ? 'Đăng nhập vào Operations Center' : 'Tạo tài khoản McPro của bạn'}
           </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 md:px-0 animate-fade-in-up animate-stagger-3">
        <div className="bg-white/80 backdrop-blur-2xl py-12 px-8 md:px-14 shadow-mc rounded-[3.5rem] border border-white overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-red via-primary-yellow to-primary-red opacity-80"></div>
          
          {error && (
            <div className="mb-6 p-5 bg-red-50/80 border border-primary-red/10 text-primary-red rounded-3xl text-sm font-black flex items-center animate-shake backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6 mr-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-5 bg-green-50/80 border border-green-500/10 text-green-700 rounded-3xl text-sm font-black flex items-center animate-mc-entry backdrop-blur-sm">
              <CheckCircle className="w-6 h-6 mr-4 flex-shrink-0" />
              {message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleAuth}>
            {!isLogin && (
              <div className="animate-mc-entry">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4 mb-2">FullName</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-primary-red transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent rounded-[2rem]
                             focus:bg-white focus:ring-0 focus:border-primary-yellow/50
                             outline-none transition-[background-color,border-color] duration-300 font-bold text-gray-900 placeholder:text-gray-300 text-lg shadow-inner"
                    placeholder="McName của bạn..."
                  />
                </div>
              </div>
            )}

            <div className="animate-mc-entry">
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4 mb-2">McEmail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-primary-red transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent rounded-[2rem]
                           focus:bg-white focus:ring-0 focus:border-primary-yellow/50
                           outline-none transition-[background-color,border-color] duration-300 font-bold text-gray-900 placeholder:text-gray-300 text-lg shadow-inner"
                  placeholder="name@mcpro.com"
                />
              </div>
            </div>

            <div className="animate-mc-entry delay-100">
              <div className="flex items-center justify-between ml-4 mb-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">McPassword</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-black text-primary-red hover:underline focus:outline-none uppercase tracking-widest"
                  >
                    Quên?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-primary-red transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent rounded-[2rem]
                           focus:bg-white focus:ring-0 focus:border-primary-yellow/50
                           outline-none transition-[background-color,border-color] duration-300 font-bold text-gray-900 placeholder:text-gray-300 text-lg shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between ml-2 animate-mc-entry delay-200">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-5 w-5 text-primary-red focus:ring-primary-red border-gray-100 rounded-lg cursor-pointer transition-all"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-xs font-black text-gray-400 uppercase tracking-widest cursor-pointer">
                    Ghi nhớ
                  </label>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="mc-button-primary w-full h-20 rounded-[2rem] text-lg font-display font-black flex items-center justify-center gap-3 shadow-mc group"
              >
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (isLogin ? 'ĐĂNG NHẬP NGAY' : 'TẠO TÀI KHOẢN')}
                {!loading && <LogIn className="w-6 h-6 group-hover:translate-x-2 transition-transform" />}
              </button>
            </div>
          </form>

          <div className="mt-12 group-items">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100/50"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-6 bg-white/50 backdrop-blur-xl text-gray-300 font-black uppercase tracking-[0.4em] text-[9px] rounded-full">McSocial</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleGoogleLogin}
                className="mc-button-secondary w-full h-18 rounded-[2rem] border-gray-100/50 flex items-center justify-center gap-4 group"
              >
                <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-display font-black uppercase text-sm tracking-widest text-gray-600">Google Account</span>
              </button>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="px-8 py-3 bg-gray-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-100 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 group"
            >
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-primary-red transition-colors">
                {isLogin ? (
                  <>New to McPro? <span className="text-primary-red ml-2 italic">Register</span></>
                ) : (
                  <>Already McPro? <span className="text-primary-red ml-2 italic">Login</span></>
                )}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

