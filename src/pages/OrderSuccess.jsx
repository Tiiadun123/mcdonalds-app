import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { CheckCircle, Package, ArrowRight, Home, MapPin, Search } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const { clearCart } = useCartStore();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear cart immediately on landing this page
    clearCart();

    const fetchOrder = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(*))')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order:", error);
        addToast("Không tìm thấy đơn hàng", "error");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, addToast, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mc-gray pt-24 pb-12 flex flex-col items-center justify-center">
        <Navbar />
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-mc-red"></div>
        <p className="mt-4 text-mc-dark font-black tracking-widest uppercase">Đang tải hóa đơn...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-mc-gray pt-28 pb-12">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Header */}
        <div className="bg-white rounded-3xl p-8 shadow-mc border border-mc-gray mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-mc-red via-mc-yellow to-mc-red"></div>
          
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          
          <h1 className="text-4xl font-black text-mc-dark mb-2 tracking-tighter uppercase">Thanh Toán Thành Công!</h1>
          <p className="text-gray-500 mb-8 font-medium">Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/my-orders')}
              className="mc-button-secondary rounded-2xl px-8 py-4 flex items-center gap-2 font-black uppercase tracking-widest text-sm"
            >
              <Package className="w-5 h-5" /> Theo Dõi Đơn Hàng
            </button>
            <button
              onClick={() => navigate('/catalog')}
              className="mc-button-primary rounded-2xl px-8 py-4 flex items-center gap-2 font-black uppercase tracking-widest text-sm"
            >
              Tiếp Tục Mua Sắm <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* E-Receipt Details */}
        <div className="bg-white rounded-3xl shadow-mc border border-mc-gray p-8">
          <h2 className="text-2xl font-black text-mc-dark mb-6 tracking-tight uppercase flex items-center gap-3">
            <Search className="w-6 h-6 text-mc-red" />
            Chi Tiết Đơn Hàng
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-dashed border-gray-200">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Mã Đơn Hàng</p>
              <p className="font-black text-mc-dark text-lg">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Phương Thức Thanh Toán</p>
              <p className="font-bold text-gray-800 capitalize">
                {order.payment_method === 'cash' ? 'Tiền Mặt (COD)' : order.payment_method === 'momo' ? 'MoMo' : 'Trực Tuyến'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Thời Gian Đặt Hàng</p>
              <p className="font-bold text-gray-800">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Địa Chỉ Bấm Giờ</p>
              <p className="font-bold text-gray-800 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-mc-red mt-1 flex-shrink-0" />
                {order.delivery_address}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Món Đã Đặt</p>
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-mc-gray rounded-xl p-2 flex items-center justify-center">
                    <img 
                      src={item.product?.image_url || '/placeholder.png'} 
                      alt={item.product?.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-mc-dark">{item.product?.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">x{item.quantity}</p>
                  </div>
                </div>
                <p className="font-black text-mc-dark">${(item.price_at_time * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="bg-mc-gray rounded-2xl p-6 flex items-center justify-between">
            <span className="font-bold text-gray-500 uppercase tracking-widest text-sm">Tổng Cộng</span>
            <span className="text-3xl font-black text-mc-red">${order.total_amount?.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
