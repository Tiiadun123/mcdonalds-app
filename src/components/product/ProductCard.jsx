import { Plus, ShoppingCart, Zap, Ban, Eye, X, Heart } from 'lucide-react';
import { useEffect, useRef, useState, memo } from 'react';
import { useToastStore } from '../../store/useToastStore';
import { useWishlistStore } from '../../store/useWishlistStore';

const ProductCard = memo(function ProductCard({ product, onAdd, index = 0 }) {
  const isAvailable = product.is_available !== false;
  const [isVisible, setIsVisible] = useState(false);
  const [showQuickLook, setShowQuickLook] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  
  // Wishlist State
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isFavorite = isInWishlist(product.id);
  
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "50px", threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    
    return () => {
      if (ref.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const handleAdd = () => {
    if (!isAvailable) return;
    onAdd(product);
    addToast(`Đã thêm ${product.name} vào giỏ hàng!`, 'success');
  };

  const staggerDelay = (index % 12) * 100;

  return (
    <div 
      ref={ref}
      className={`group motion-depth relative bg-white border border-gray-100/60 rounded-[2.5rem] p-6 transition-[box-shadow,border-color,transform] duration-300 hover:shadow-mc hover:border-primary-red/20 overflow-hidden flex flex-col ${isVisible ? 'animate-fade-in-up' : 'opacity-0'} ${!isAvailable ? 'grayscale-[0.8] opacity-80' : ''}`}
      style={{ animationDelay: isVisible ? `${staggerDelay}ms` : '0ms' }}
    >
      
      {/* Dynamic Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary-red/[0.03] to-transparent opacity-0 motion-depth-glow pointer-events-none"></div>

      {/* Image container */}
      <div className="relative motion-depth-card aspect-square w-full mb-8 overflow-hidden rounded-[2rem] bg-gray-50/50 flex items-center justify-center p-8 isolate group-hover:bg-gray-100/30 transition-colors duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-primary-yellow/15 rounded-full blur-[60px] group-hover:scale-110 transition-transform duration-500 z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 bg-primary-red/5 rounded-full blur-[40px] group-hover:scale-120 transition-transform duration-500 z-0 delay-100"></div>

        <img
          loading="lazy"
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/hero-burger.png';
          }}
          className={`relative object-contain w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)] motion-depth-media z-10 group-hover:animate-float ${
            isAvailable ? '' : 'opacity-40'
          }`}
        />
        
        {!isAvailable && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <div className="bg-primary-red text-white px-6 py-3 rounded-2xl font-display font-black text-xs uppercase tracking-[0.2em] shadow-2xl rotate-[-10deg] animate-mc-entry flex items-center gap-2">
               <Ban className="w-4 h-4" /> HẾT HÀNG
            </div>
          </div>
        )}
        
        {/* kcal badge */}
        <div className="absolute top-5 left-5 bg-white/80 backdrop-blur-xl border border-white/50 text-[10px] font-black text-gray-800 px-3 py-1.5 rounded-xl shadow-sm z-20 uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary-yellow fill-primary-yellow" />
          {product.kcal || "520"} KCAL
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
            addToast(isFavorite ? 'Đã bỏ khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích', 'info');
          }}
          className="absolute top-5 right-5 z-20 p-2 bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm hover:scale-110 hover:bg-white transition-all duration-300"
        >
          <Heart 
            className={`w-5 h-5 transition-colors duration-300 ${isFavorite ? 'fill-primary-red text-primary-red' : 'text-gray-400'}`} 
          />
        </button>

        {/* Quick Look Button */}
        <button
          onClick={() => setShowQuickLook(true)}
          className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm tracking-wide flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Eye className="w-4 h-4" /> Xem Nhanh
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 z-10 relative flex-1 flex flex-col justify-start">
        <h3 className="font-display font-black text-xl text-gray-900 group-hover:text-primary-red transition-colors line-clamp-2 leading-[1.1] tracking-tighter">
          {product.name}
        </h3>
        <p className="text-xs font-medium text-gray-400 line-clamp-2 leading-relaxed tracking-tight group-hover:text-gray-500 transition-colors">
          {product.description || "Thưởng thức hương vị đẳng cấp từ công thức bí mật nhất tại McPro Store."}
        </p>

        {/* Footer / Actions */}
        <div className="pt-6 mt-auto flex items-end justify-between border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-300 font-bold line-through mb-1 tracking-widest">
              ${(product.price * 1.3).toFixed(2)}
            </span>
            <div className="text-4xl font-display font-black text-gray-900 tracking-tighter flex items-center">
              <span className="text-primary-red text-lg mr-0.5 font-bold mb-2">$</span>
              {product.price}
            </div>
          </div>
          
          <button 
            onClick={handleAdd}
            disabled={!isAvailable}
            className={`h-14 w-14 p-0 flex items-center justify-center rounded-2xl group/btn transition-all ${
              isAvailable 
                ? 'mc-button-primary' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-200 shadow-none'
            }`}
          >
            {isAvailable ? (
              <Plus className="w-6 h-6 stroke-[3] group-hover/btn:rotate-90 transition-transform duration-500" />
            ) : (
              <ShoppingCart className="w-5 h-5 opacity-40" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Look Modal */}
      {showQuickLook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQuickLook(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden animate-bounce-in shadow-2xl flex flex-col md:flex-row">
            <button 
              onClick={() => setShowQuickLook(false)}
              className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-black/5 p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-gray-50/50 p-8 flex items-center justify-center md:w-1/2">
              <img src={product.image} alt={product.name} className="w-full h-auto drop-shadow-2xl" />
            </div>
            <div className="p-8 md:w-1/2 flex flex-col justify-center">
              <h2 className="text-2xl font-black font-display text-gray-900 leading-tight mb-2 tracking-tighter">{product.name}</h2>
              <p className="text-sm text-gray-500 mb-6 font-medium">{product.description || "Hương vị bùng nổ, chuẩn chất McDonald's nguyên bản."}</p>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary-yellow/20 text-primary-yellow px-3 py-1 rounded-lg text-xs font-black tracking-widest">{product.kcal || "520"} KCAL</div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-black tracking-widest">SẴN SÀNG</div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="text-3xl font-display font-black text-gray-900 tracking-tighter flex items-center">
                  <span className="text-primary-red text-base mr-0.5 font-bold mb-1">$</span>
                  {product.price}
                </div>
                <button 
                  onClick={() => {
                    handleAdd();
                    setShowQuickLook(false);
                  }}
                  className="bg-primary-red text-white w-12 h-12 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProductCard;
