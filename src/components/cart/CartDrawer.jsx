import { useState, useEffect, useMemo } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { supabase, supabaseConfigError } from '../../lib/supabase';
import { X, Minus, Plus, ShoppingBag, Loader2, CheckCircle, Lock, Trash2, ArrowRight, MapPin, CreditCard, Wallet, Coins, Sparkles, TicketPercent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LOCAL_MOMO_QR_PATHS = ['/momo-qr.svg', '/momo-qr.png', '/momo-qr-hung.png', '/qr-momo.png'];

export default function CartDrawer({ isOpen, onClose }) {
  const { items, removeItem, addItem, deleteItem, clearCart, getTotalPrice } = useCartStore();
  const { user, profile, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [customerName, setCustomerName] = useState(user?.user_metadata?.full_name || '');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'momo', 'zalopay'
  const [isLocating, setIsLocating] = useState(false);
  const [momoPayment, setMomoPayment] = useState(null);
  const [momoQrIndex, setMomoQrIndex] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  
  // Sync customerName when user profile is loaded
  useEffect(() => {
    if (user && !customerName) {
      setCustomerName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    }
  }, [user, customerName]);

  useEffect(() => {
    if (!address && profile?.address) {
      setAddress(profile.address);
    }
  }, [profile?.address, address]);

  const totalPrice = getTotalPrice();
  const discountAmount = useMemo(() => {
    if (!voucher?.discount_percent) return 0;
    return Number((totalPrice * (Number(voucher.discount_percent) / 100)).toFixed(2));
  }, [totalPrice, voucher]);
  const finalTotal = useMemo(() => Math.max(0, Number((totalPrice - discountAmount).toFixed(2))), [totalPrice, discountAmount]);
  const rewardPoints = Math.floor(finalTotal * 10);
  const momoFallbackQrImage = useMemo(() => {
    if (!momoPayment) return '';
    const payload = `MOMO|${momoPayment.code}|${momoPayment.amount}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(payload)}`;
  }, [momoPayment]);
  const momoQrCandidates = useMemo(() => {
    if (!momoPayment) return [];

    const localQrFromEnv = import.meta.env.VITE_MOMO_QR_LOCAL_PATH;
    return Array.from(
      new Set(
        [momoPayment.qrImage, localQrFromEnv, ...LOCAL_MOMO_QR_PATHS, momoFallbackQrImage]
          .filter((value) => Boolean(value))
      )
    );
  }, [momoPayment, momoFallbackQrImage]);

  const generatePaymentCode = (orderId) => `MOMO-${String(orderId).slice(0, 8).toUpperCase()}`;

  const getMomoQrImage = async () => {
    const localQr = import.meta.env.VITE_MOMO_QR_LOCAL_PATH || LOCAL_MOMO_QR_PATHS[0];
    const envQr = import.meta.env.VITE_MOMO_QR_IMAGE_URL;
    if (envQr) return envQr;

    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('qr_image_url')
        .eq('provider', 'momo')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) return localQr;
      return data?.qr_image_url || localQr;
    } catch {
      return localQr;
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      addToast("Trình duyệt của bạn không hỗ trợ định vị.", "error");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setAddress(`Tọa độ: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (McPro Store Nearby)`);
        setIsLocating(false);
        addToast("Đã lấy được vị trí của bạn.", "success");
      },
      (error) => {
        addToast("Không thể lấy vị trí: " + error.message, "error");
        setIsLocating(false);
      }
    );
  };

  const handleApplyVoucher = async () => {
    const normalizedCode = voucherCode.trim().toUpperCase();
    if (!normalizedCode) {
      setVoucherError('Vui lòng nhập mã voucher.');
      return;
    }
    if (!supabase) {
      setVoucherError('Supabase chưa được cấu hình.');
      return;
    }

    try {
      setIsApplyingVoucher(true);
      setVoucherError('');

      const { data, error } = await supabase
        .from('vouchers')
        .select('id, code, discount_percent, expiry_date, is_active')
        .eq('code', normalizedCode)
        .maybeSingle();

      if (error) throw error;
      if (!data || !data.is_active) {
        setVoucher(null);
        setVoucherError('Mã voucher không hợp lệ hoặc đã bị khóa.');
        return;
      }

      if (data.expiry_date && new Date(data.expiry_date).getTime() < Date.now()) {
        setVoucher(null);
        setVoucherError('Voucher đã hết hạn.');
        return;
      }

      setVoucher({
        code: data.code,
        discount_percent: Number(data.discount_percent || 0),
      });
      setVoucherCode(data.code);
      addToast(`Đã áp dụng mã giảm giá ${data.discount_percent}%!`, "success");
    } catch (error) {
      setVoucher(null);
      setVoucherError(error.message || 'Không thể áp dụng voucher lúc này.');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!supabase) {
      addToast(supabaseConfigError || 'Supabase chưa được cấu hình.', "error");
      return;
    }
    if (!customerName.trim()) {
      addToast("Vui lòng nhập tên khách hàng.", "error");
      return;
    }
    if (!address.trim()) {
      addToast("Vui lòng nhập địa chỉ giao hàng.", "error");
      return;
    }

    console.log("🚀 McPro: Đang bắt đầu Checkout...", { items, total: finalTotal, customerName, userId: user?.id });
    
    try {
      setIsSubmitting(true);
      
      console.log("📦 McPro: Đang tạo đơn hàng chính...");
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          customer_name: customerName, 
          delivery_address: address.trim(),
          payment_method: paymentMethod,
          total_amount: finalTotal,
          payment_ref: voucher ? `voucher:${voucher.code}` : null,
          status: 'pending',
          user_id: user ? user.id : null // Allow guest checkout (user_id is null)
        }])
        .select()
        .single();
        
      if (orderError) throw orderError;
      console.log("✅ McPro: Đã tạo đơn hàng thành công ID:", orderData.id);
      
      console.log("🍱 McPro: Đang tạo chi tiết đơn hàng cho", items.length, "món...");
      const orderItemsToInsert = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_time: item.product.price
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);
        
      if (itemsError) throw itemsError;

      // 5. Update User Points (Loyalty)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', user.id)
          .single();
        
        const currentPoints = profile?.points || 0;
        await supabase
          .from('profiles')
          .update({ points: currentPoints + rewardPoints })
          .eq('id', user.id);
          
        // Refresh local store to show new points immediately
        useAuthStore.getState().refreshProfile();
      }

      // 6. Mock Payment Processing
      if (paymentMethod === 'momo') {
        const qrImage = await getMomoQrImage();
        clearCart();
        setMomoQrIndex(0);
        setMomoPayment({
          orderId: orderData.id,
          amount: Number(finalTotal).toFixed(2),
          code: generatePaymentCode(orderData.id),
          qrImage,
        });
        return;
      }

      if (paymentMethod !== 'cash') {
        console.log("💳 McPro: Đang xử lý thanh toán trực tuyến...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setIsSuccess(true);
      clearCart();
      setVoucher(null);
      setVoucherCode('');
      addToast("Đặt hàng thành công! Cám ơn bạn.", "success");
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error("Lỗi đặt hàng chi tiết:", error);
      let errorMsg = error.message || "Đã xảy ra lỗi không xác định.";
      
      if (error.code === '42703' || (error.message && error.message.includes('column "user_id" does not exist'))) {
        errorMsg = "LỖI HỆ THỐNG: Cột 'user_id' chưa được tạo trong Database. Hãy chạy đoạn mã SQL tôi đã gửi trong Supabase Dashboard!";
      } else if (error.code === '42P01') {
        errorMsg = "LỖI HỆ THỐNG: Bảng 'orders' hoặc 'order_items' không tồn tại.";
      }
      
      addToast("❌ McPro Checkout Error: " + errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white/95 backdrop-blur-2xl shadow-mc z-50 flex flex-col transform transition-transform duration-400 ease-out animate-in slide-in-from-right overflow-hidden border-l border-white/20 will-change-transform">
        
        {/* Header */}
        <div className="flex items-center justify-between p-10 border-b border-gray-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-red/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <h2 className="text-3xl font-display font-black text-gray-900 flex items-center gap-3 tracking-tighter uppercase relative z-10 text-nowrap">
            <ShoppingBag className="w-8 h-8 text-primary-red stroke-[2.5]" />
            Giỏ hàng <span className="text-primary-red italic text-nowrap">Của bạn</span>
          </h2>
          <button 
            onClick={onClose} 
            className="group p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors relative z-10"
          >
            <X className="w-6 h-6 text-gray-400 group-hover:text-gray-900 group-hover:rotate-90 transition-[color,transform] duration-200" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 hide-scrollbar">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-mc-entry">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-20"></div>
                 <CheckCircle className="w-24 h-24 text-green-500 relative z-10" />
              </div>
              <h3 className="text-4xl font-display font-black text-gray-900 tracking-tighter uppercase">Thành công!</h3>
              <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">Món ăn đang được chuẩn bị và sẽ giao đến McAddress của bạn sớm nhất.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40 grayscale animate-mc-entry">
              <ShoppingBag className="w-32 h-32 text-gray-300" />
              <p className="text-xl font-display font-black text-gray-400 uppercase tracking-widest">Giỏ hàng đang trống</p>
              <button 
                onClick={onClose}
                className="mc-button-secondary text-xs px-8 py-3 rounded-xl border-gray-200"
              >
                KHÁM PHÁ NGAY
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {items.map((item) => (
                <div key={item.product_id} className="flex gap-6 group-items">
                  <div className="w-24 h-24 bg-gray-50/50 rounded-3xl flex items-center justify-center p-3 shrink-0 border border-gray-100/50 shadow-sm group-hover:shadow-xl group-hover:shadow-gray-900/5 transition-shadow duration-300 relative">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/hero-burger.png';
                      }}
                      className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute -top-2 -left-2 bg-primary-red text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                       x{item.quantity}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-display font-black text-gray-900 line-clamp-1 uppercase tracking-tight text-lg">{item.product.name}</h4>
                    <div className="flex items-center gap-3">
                       <span className="font-display font-black text-primary-red text-xl">${item.product.price}</span>
                       <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">per item</span>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-3 bg-gray-100 border border-gray-100/50 rounded-xl p-1 shadow-inner">
                        <button onClick={() => removeItem(item.product_id)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg hover:shadow-sm transition-[background-color,color,box-shadow] duration-200 text-gray-500 hover:text-primary-red">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-display font-black text-sm">{item.quantity}</span>
                        <button onClick={() => addItem(item.product)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg hover:shadow-sm transition-[background-color,color,box-shadow] duration-200 text-gray-500 hover:text-green-600">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button onClick={() => deleteItem(item.product_id)} className="p-3 text-gray-300 hover:text-primary-red transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="font-display font-black text-2xl self-center tracking-tighter text-gray-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
              
              {/* CROSS-SELL COMPONENT */}
              {items.length > 0 && (
                <div className="mt-8 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Gợi ý mua kèm</h4>
                  <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center p-1">
                          <img src="/hero-burger.png" alt="Fries" className="w-full h-full object-contain grayscale opacity-50" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Khoai tây chiên giòn</p>
                          <p className="text-xs font-black text-primary-red">+$2.00</p>
                        </div>
                     </div>
                     <button 
                       className="p-2 bg-gray-900 hover:bg-black text-white rounded-xl transition-colors"
                       onClick={() => {
                          addToast("Đã thêm Khoai tây chiên", "success");
                       }}
                     >
                        <Plus className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Checkout */}
        {!isSuccess && items.length > 0 && (
          <div
            className="max-h-[58vh] lg:max-h-none overflow-y-auto overscroll-contain hide-scrollbar p-6 sm:p-8 lg:p-10 border-t border-gray-100 bg-white/80 backdrop-blur-xl space-y-6 shadow-[0_-20px_40px_rgba(0,0,0,0.02)] pb-10"
            style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
          >
            <div className="space-y-3">
               <div className="flex items-center justify-between text-gray-400 font-bold text-xs uppercase tracking-widest">
                <span>Tạm tính</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400 font-bold text-xs uppercase tracking-widest">
                <span>Giam gia voucher</span>
                <span className="text-green-600">-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50/50">
                 <span className="text-gray-400 text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
                   <Sparkles className="w-4 h-4 text-primary-yellow" />
                   McPoints nhận được
                 </span>
                 <span className="text-gray-900 font-display font-black text-sm">+{rewardPoints}</span>
              </div>
              <div className="flex items-center justify-between text-4xl font-display font-black text-gray-900 tracking-tighter">
                <span className="uppercase">Tổng cộng</span>
                <div className="flex items-center">
                   <span className="text-primary-red text-xl mr-1 font-bold -translate-y-1 inline-block">$</span>
                     {finalTotal.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">McName cho đơn hàng này</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên của bạn..." 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-8 py-5 border-2 border-gray-100 rounded-3xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-red/10 focus:border-primary-red/20 transition-[background-color,border-color,box-shadow] duration-200 font-bold text-gray-900 placeholder:text-gray-300 shadow-inner"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Địa chỉ giao hàng</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Nhập địa chỉ hoặc định vị nhanh..." 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-8 pr-16 py-5 border-2 border-gray-100 rounded-3xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-red/10 focus:border-primary-red/20 transition-[background-color,border-color,box-shadow] duration-200 font-bold text-gray-900 placeholder:text-gray-300 shadow-inner"
                    />
                    <button 
                      onClick={handleLocate}
                      disabled={isLocating}
                      className="absolute right-3 top-3 p-3 bg-white text-gray-900 rounded-2xl border border-gray-100 shadow-sm hover:bg-primary-yellow transition-colors duration-200"
                    >
                      {isLocating ? <Loader2 className="w-4 h-4 animate-spin text-primary-red" /> : <MapPin className="w-4 h-4" />}
                    </button>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Hình thức thanh toán</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'cash', label: 'Tiền mặt', icon: Coins },
                      { id: 'momo', label: 'MoMo', icon: Wallet, color: 'text-pink-500' },
                      { id: 'zalopay', label: 'ZaloPay', icon: CreditCard, color: 'text-blue-500' }
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-[background-color,border-color,color,box-shadow] duration-200 group/method ${
                          paymentMethod === method.id 
                            ? 'bg-gray-900 border-gray-900 text-white shadow-xl' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <method.icon className={`w-6 h-6 mb-2 ${paymentMethod === method.id ? 'text-primary-yellow' : method.color || ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Voucher</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value.toUpperCase());
                        setVoucherError('');
                      }}
                      placeholder="Nhap ma giam gia"
                      className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-red/10 focus:border-primary-red/20 transition-[background-color,border-color,box-shadow] duration-200 font-bold text-gray-900 placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={isApplyingVoucher}
                      className="shrink-0 px-5 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest"
                    >
                      {isApplyingVoucher ? 'Dang ap' : 'Ap dung'}
                    </button>
                  </div>
                  {voucher && (
                    <p className="text-xs font-bold text-green-600 flex items-center gap-2">
                      <TicketPercent className="w-4 h-4" />
                      Da ap dung {voucher.code} (-{voucher.discount_percent}%)
                    </p>
                  )}
                  {voucherError && <p className="text-xs font-bold text-red-600">{voucherError}</p>}
               </div>
            </div>

            {/* Remove strict lock, allow guest checkout. Add slight notice for points */}
            {!isAuthenticated ? (
              <div className="space-y-3">
                <button 
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className={`mc-button-primary w-full h-20 rounded-3xl text-lg flex justify-center items-center gap-3 shadow-mc group ${(!customerName.trim() || !address.trim() || isSubmitting) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> ĐANG XỬ LÝ...</>
                  ) : (
                    <>
                      THANH TOÁN (KHÁCH) <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300 stroke-[3]" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => { onClose(); navigate('/login'); }}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-primary-red hover:underline text-center"
                >
                  Đăng nhập để tích {rewardPoints} điểm McPoints
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCheckout}
                disabled={isSubmitting}
                className={`mc-button-primary w-full h-20 rounded-3xl text-lg flex justify-center items-center gap-3 shadow-mc group ${(!customerName.trim() || !address.trim() || isSubmitting) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <>
                    THANH TOÁN NGAY
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>
            )}

            {paymentMethod === 'momo' && (
              <p className="text-center text-[10px] text-pink-600 font-black uppercase tracking-widest">
                Sau khi tao don hang, he thong se hien QR MoMo de ban quet thanh toan.
              </p>
            )}
            
            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Secure Checkout powered by McPro Store</p>
          </div>
        )}
      </div>

      {momoPayment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-gray-900/60" onClick={() => setMomoPayment(null)}></div>
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900">Quet ma MoMo de thanh toan</h3>
            <p className="mt-2 text-sm text-gray-500">Ma don: <span className="font-black text-gray-900">{momoPayment.code}</span></p>
            <p className="mt-1 text-sm text-gray-500">So tien: <span className="font-black text-primary-red">${momoPayment.amount}</span></p>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              {momoQrIndex < momoQrCandidates.length ? (
                <img
                  src={momoQrCandidates[momoQrIndex]}
                  alt="MoMo QR"
                  className="mx-auto h-64 w-64 object-contain rounded-xl bg-white p-2"
                  onError={() => setMomoQrIndex((prev) => prev + 1)}
                />
              ) : (
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-bold text-gray-800">Khong tai duoc anh QR MoMo.</p>
                  <p>
                    Vui long kiem tra lai file public/momo-qr.png, bien VITE_MOMO_QR_IMAGE_URL, hoac ban ghi payment_settings (provider = momo, is_active = true).
                  </p>
                  <p>
                    Ban van co the thanh toan thu cong bang ma don: <span className="font-black text-gray-900">{momoPayment.code}</span>
                  </p>
                </div>
              )}
              {momoQrIndex > 0 && momoQrIndex < momoQrCandidates.length && (
                <p className="mt-3 text-xs font-bold text-amber-600 uppercase tracking-wider text-center">
                  Dang dung QR du phong vi nguon truoc do loi.
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setMomoPayment(null);
                  setIsSuccess(true);
                  setTimeout(() => {
                    setIsSuccess(false);
                    onClose();
                  }, 1800);
                }}
                className="rounded-xl bg-gray-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white"
              >
                Da thanh toan
              </button>
              <button
                onClick={() => setMomoPayment(null)}
                className="rounded-xl border border-gray-300 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-700"
              >
                Dong
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
