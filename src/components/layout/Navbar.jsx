import { ShoppingCart, ShoppingBag, Search, Menu, User, LogOut, ChevronDown, LogIn, ShieldCheck, Filter, Star, Sparkles } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar({
  onOpenCart = () => {},
  searchQuery = '',
  onSearchChange = () => {},
  showSearch = true,
}) {
  const getTotalItems = useCartStore(state => state.getTotalItems);
  const getTotalPrice = useCartStore(state => state.getTotalPrice);
  const { profile, isAuthenticated, signOut } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice().toFixed(2);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <button className="lg:hidden p-2 text-gray-900 rounded-xl hover:bg-gray-100 transition-colors">
            <Menu className="w-6 h-6 stroke-[2.5]" />
          </button>
          <Link to="/" className="flex items-center gap-3 cursor-pointer group">
            {/* McDonald's style icon */}
            <div className="w-12 h-12 bg-primary-red rounded-2xl flex items-center justify-center font-display font-black text-primary-yellow text-3xl tracking-tighter shadow-xl shadow-red-900/20 group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300 will-change-transform">
              M
            </div>
            <span className="hidden lg:inline text-2xl font-display font-black tracking-tighter text-gray-900 uppercase">
              McDelivery <span className="text-primary-red">PRO</span>
            </span>
          </Link>
        </div>

        {/* Navigation + Search Section */}
        <div className="hidden lg:flex flex-1 max-w-3xl mx-8 items-center gap-6">
          <nav className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl text-sm font-black text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors uppercase tracking-tight"
            >
              Trang chu
            </Link>
            <Link
              to="/catalog"
              className="px-4 py-2 rounded-xl text-sm font-black text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors uppercase tracking-tight"
            >
              Thuc don
            </Link>
          </nav>

          {showSearch && (
          <div className="relative w-full group">
            <input 
              type="text" 
              placeholder="Hôm nay bạn muốn ăn gì?" 
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl
                         focus:bg-white focus:border-primary-yellow/50 focus:ring-4 focus:ring-primary-yellow/10 
                         outline-none transition-all duration-300 font-medium text-gray-900 placeholder:text-gray-400"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-primary-yellow transition-colors" />
          </div>
          )}
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1.5 pl-3 pr-2 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 transition-colors group shadow-sm"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-1 text-nowrap">Xin chào,</p>
                  <p className="text-sm font-black text-gray-800 leading-none text-nowrap">{profile?.full_name?.split(' ')[0] || 'Member'}</p>
                </div>

                {/* Points Badge */}
                {profile?.points > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary-yellow/10 border border-primary-yellow/20 rounded-xl animate-mc-entry">
                    <Sparkles className="w-3.5 h-3.5 text-primary-yellow fill-primary-yellow/20" />
                    <span className="text-[11px] font-black text-gray-900 tracking-tighter uppercase whitespace-nowrap">
                      {profile.points} <span className="text-primary-red">PTS</span>
                    </span>
                  </div>
                )}

                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:border-primary-yellow group-hover:text-primary-red transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 p-2 overflow-hidden animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-black text-gray-900 truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center mt-0.5">
                      {profile?.role === 'admin' ? (
                        <>
                          <ShieldCheck className="w-3 h-3 mr-1 text-primary-red" />
                          Quản trị viên
                        </>
                      ) : 'Khách hàng thân thiết'}
                    </p>
                  </div>
                  <Link 
                    to="/my-orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 text-primary-red" />
                    Đơn hàng của tôi
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <Star className="w-4 h-4 text-primary-yellow" />
                    Rewards Center
                  </Link>

                  {profile?.role === 'admin' && (
                    <>
                      <Link 
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <ShieldCheck className="w-4 h-4 text-primary-red" />
                        Quản lý đơn hàng
                      </Link>
                      <Link 
                        to="/admin/products"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <Filter className="w-4 h-4 text-primary-yellow" />
                        Quản lý thực đơn
                      </Link>
                    </>
                  )}
                  <button 
                    onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-red-50 hover:text-primary-red rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/login"
              className="flex items-center gap-2 px-6 py-3.5 bg-gray-50 text-gray-900 rounded-2xl font-black text-sm hover:bg-gray-900 hover:text-white border-2 border-gray-100 transition-all shadow-sm group"
            >
              <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <span className="hidden sm:inline">ĐĂNG NHẬP</span>
            </Link>
          )}

          <div className="w-px h-8 bg-gray-200/50 mx-1 hidden sm:block"></div>
          
          <button 
            onClick={onOpenCart}
            className="relative flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold transition-[background-color,transform,box-shadow] duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 active:scale-95 group"
          >
            <ShoppingCart className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            
            {/* Badge */}
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-yellow text-sm text-gray-900 font-black shadow-lg ring-2 ring-white">
              {totalItems}
            </span>
            {totalItems > 0 && (
              <span className="ml-2 pl-3 border-l border-gray-700 hidden sm:inline">${totalPrice}</span>
            )}
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="lg:hidden px-4 sm:px-6 pb-4 max-w-[1440px] mx-auto">
          <div className="relative group">
            <input
              type="text"
              placeholder="Tim mon ban muon..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/80 border border-gray-200 rounded-2xl
                         focus:bg-white focus:border-primary-yellow/50 focus:ring-4 focus:ring-primary-yellow/10
                         outline-none transition-all duration-300 font-semibold text-gray-900 placeholder:text-gray-400"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-yellow transition-colors" />
          </div>
        </div>
      )}
    </header>
  );
}

