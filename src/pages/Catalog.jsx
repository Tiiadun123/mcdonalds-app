import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Hero from '../components/layout/Hero';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import CartDrawer from '../components/cart/CartDrawer';
import { Filter, AlertTriangle, ShieldCheck, ArrowDownAz, ArrowUpZa, Flame, Heart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useMenu } from '../hooks/useMenu';
import { useWishlistStore } from '../store/useWishlistStore';

export default function Catalog() {
  const {
    activeCategoryId,
    setActiveCategoryId,
    categories,
    products,
    loading,
    error,
  } = useMenu();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sortBy, setSortBy] = useState('default'); // 'price_asc', 'price_desc', 'kcal_asc'
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [searchParams] = useSearchParams();
  const { profile } = useAuthStore();

  const addItem = useCartStore(state => state.addItem);
  const { wishlist } = useWishlistStore();

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    let result = products.filter((p) => {
      // Wishlist filter
      if (showWishlistOnly && !wishlist.includes(p.id)) return false;

      const matchCategory = !activeCategoryId || p.category_id === activeCategoryId;
      if (!matchCategory) return false;
      if (!normalizedSearch) return true;

      const searchText = `${p.name || ''} ${p.description || ''}`.toLowerCase();
      return searchText.includes(normalizedSearch);
    });

    if (sortBy === 'price_asc') {
      result = result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result = result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'kcal_asc') {
      result = result.sort((a, b) => (parseInt(a.kcal) || 520) - (parseInt(b.kcal) || 520));
    }

    return result;
  }, [products, activeCategoryId, normalizedSearch, sortBy, showWishlistOnly, wishlist]);

  const activeCategory = useMemo(() => {
    if (!Array.isArray(categories)) return null;
    return categories.find((c) => c.id === activeCategoryId) || null;
  }, [categories, activeCategoryId]);

  const activeCategoryName = activeCategory?.name || 'Sản phẩm';

  useEffect(() => {
    const slug = searchParams.get('category');
    if (!slug || !categories.length) return;
    const matched = categories.find((c) => c.slug === slug);
    if (matched) {
      setActiveCategoryId(matched.id);
    }
  }, [searchParams, categories, setActiveCategoryId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <AlertTriangle className="w-16 h-16 text-primary-red mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Đã xảy ra lỗi hệ thống</h1>
        <p className="text-gray-500 max-w-md mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-primary-red text-white font-bold rounded-xl shadow-lg"
        >
          Thử tải lại trang
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary-red selection:text-white bg-gray-50/30">
      {/* Admin Link Bar */}
      {profile?.role === 'admin' && (
        <div className="px-6 lg:px-12 py-3 border-b border-primary-red/10 bg-primary-red text-white">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <span className="text-xs font-black tracking-widest uppercase flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2" /> 
              Admin Mode
            </span>
            <Link
              to="/admin"
              className="text-xs font-black bg-white text-primary-red rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 uppercase tracking-tight"
            >
              Vào trang quản lý 
            </Link>
          </div>
        </div>
      )}

      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1536px] mx-auto w-full relative z-0">
        <Sidebar 
          categories={categories}
          activeCategoryId={activeCategoryId} 
          onSelectCategory={setActiveCategoryId} 
        />
        
        <div className="flex-1 p-6 md:p-12 pb-24 border-l border-gray-100 bg-white/40 backdrop-blur-[2px] animate-fade-in">
          <Hero />

          <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between xl:justify-between mb-12 mt-20 gap-6 px-2 group-items animate-fade-in-up">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-red/5 rounded-full text-primary-red animate-stagger-1 w-max">
                 <Filter className="w-4 h-4 fill-primary-red" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">Curated Menu</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-black text-gray-900 tracking-tighter leading-none animate-stagger-2">
                {activeCategoryName} <span className="text-primary-red italic">Nổi Bật</span>
              </h1>
              <p className="text-xl text-gray-400 font-medium max-w-2xl leading-relaxed animate-stagger-3">
                Khám phá bộ sưu tập những hương vị tinh túy nhất, được chế tác tỉ mỉ từ những nguyên liệu thượng hạng dành riêng cho bạn.
              </p>
            </div>
            
            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-2 animate-stagger-4">
              <button
                onClick={() => setShowWishlistOnly(!showWishlistOnly)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${
                  showWishlistOnly 
                    ? 'bg-rose-100 text-primary-red border border-rose-200 shadow-inner' 
                    : 'bg-white text-gray-500 hover:bg-rose-50 hover:text-primary-red border border-gray-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${showWishlistOnly ? 'fill-primary-red' : ''}`} /> 
                Yêu thích ({wishlist.length})
              </button>
              <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block"></div>
              <button 
                onClick={() => setSortBy('default')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center transition-all ${sortBy === 'default' ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
              >
                Mặc định
              </button>
              <button 
                onClick={() => setSortBy('price_asc')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${sortBy === 'price_asc' ? 'bg-primary-yellow text-gray-900 shadow-xl' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
              >
                <ArrowDownAz className="w-4 h-4" /> Giá Thấp
              </button>
              <button 
                onClick={() => setSortBy('price_desc')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${sortBy === 'price_desc' ? 'bg-primary-red text-white shadow-xl' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
              >
                <ArrowUpZa className="w-4 h-4" /> Giá Cao
              </button>
              <button 
                onClick={() => setSortBy('kcal_asc')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${sortBy === 'kcal_asc' ? 'bg-emerald-500 text-white shadow-xl' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
              >
                <Flame className="w-4 h-4" /> Ít Calo
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 md:gap-14 animate-fade-in">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 md:gap-14 animate-fade-in-up">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <ProductCard 
                    key={product.id}
                    index={index}
                    product={{...product, image: product.image_url}}
                    onAdd={() => addItem(product)} 
                  />
                ))
              ) : (
                 <div className="interactive-panel col-span-full py-32 text-center bg-gray-50/30 rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                     <AlertTriangle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-display font-black text-gray-300 uppercase tracking-tighter">
                      Không tìm thấy món McPro nào
                    </p>
                    <p className="text-gray-400 font-medium">
                      {normalizedSearch
                        ? `Kết quả tìm kiếm cho "${searchQuery}" hiện chưa có sẵn.`
                        : 'Danh mục này hiện đang được cập nhật món mới.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => { setSearchQuery(''); setActiveCategoryId(''); }}
                    className="mc-button-secondary px-8 py-3 rounded-xl border-gray-200"
                  >
                    XEM TẤT CẢ DANH SÁCH
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
