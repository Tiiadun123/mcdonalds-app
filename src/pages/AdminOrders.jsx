import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList, RefreshCw, CheckCircle, Clock, Play, XCircle, ChevronRight, MapPin, Bell, Hash } from 'lucide-react';
import { supabase, supabaseConfigError } from '../lib/supabase';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả', color: 'bg-gray-100 text-gray-700', icon: ClipboardList },
  { value: 'pending', label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700', icon: Clock },
  { value: 'preparing', label: 'Đang nấu', color: 'bg-blue-100 text-blue-700', icon: Play },
  { value: 'completed', label: 'Đã xong', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle },
];

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [adminToast, setAdminToast] = useState(null);
  const knownStatusRef = useRef({});
  const toastTimeoutRef = useRef(null);
  const newOrderAlertTimeoutRef = useRef(null);
  const localStatusUpdateRef = useRef({});
  const audioCtxRef = useRef(null);

  const playNewOrderChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      const scheduleBeep = (startAt, frequency, duration = 0.14) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startAt);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.055, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startAt);
        osc.stop(startAt + duration + 0.02);
      };

      // Two-note alert: bright first ping + confirming second ping.
      scheduleBeep(now, 880, 0.13);
      scheduleBeep(now + 0.17, 740, 0.15);
    } catch {
      // Silent fail for browsers that block autoplay audio contexts.
    }
  }, []);

  const showAdminToast = useCallback((title, message, tone = 'info') => {
    const toneClasses = {
      info: 'bg-blue-50 text-blue-700 border-blue-100',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      warning: 'bg-amber-50 text-amber-700 border-amber-100',
    };

    setAdminToast({
      title,
      message,
      toneClass: toneClasses[tone] || toneClasses.info,
    });

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setAdminToast(null);
    }, 4500);
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      if (!supabase) {
        throw new Error(supabaseConfigError || 'Supabase chưa được cấu hình.');
      }

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          total_amount,
          status,
          created_at,
          order_items (
            id,
            quantity,
            price_at_time,
            products (
              id,
              name,
              image_url,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err) {
      console.error('Critical error in AdminOrders.jsx:', err);
      setError(err.message || 'Không thể tải dữ liệu đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderById = useCallback(async (orderId) => {
    if (!orderId || !supabase) {
      return null;
    }

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        total_amount,
        status,
        created_at,
        order_items (
          id,
          quantity,
          price_at_time,
          products (
            id,
            name,
            image_url,
            price
          )
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    return data;
  }, []);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    loadOrders();

    const channel = supabase
      .channel('admin_orders_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          console.log('🔔 McPro: Đơn hàng mới!', payload.new);
          const nextOrderId = payload?.new?.id;
          setNewOrderAlert(true);
          playNewOrderChime();
          showAdminToast(
            'Don hang moi',
            `#${String(payload?.new?.id || '').slice(0, 8).toUpperCase()} vua duoc tao`,
            'warning'
          );

          try {
            const freshOrder = await fetchOrderById(nextOrderId);
            if (freshOrder) {
              knownStatusRef.current[nextOrderId] = freshOrder.status;
              setOrders((prev) => {
                const next = [freshOrder, ...prev.filter((order) => order.id !== nextOrderId)];
                return next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              });
            } else {
              loadOrders();
            }
          } catch (insertRefreshError) {
            console.error('Failed to refresh inserted order:', insertRefreshError);
            loadOrders();
          }

          if (newOrderAlertTimeoutRef.current) {
            clearTimeout(newOrderAlertTimeoutRef.current);
          }

          newOrderAlertTimeoutRef.current = setTimeout(() => {
            setNewOrderAlert(false);
          }, 5000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const nextOrder = payload?.new;
          const orderId = nextOrder?.id;
          const nextStatus = nextOrder?.status;
          const prevStatus = orderId ? knownStatusRef.current[orderId] : null;
          const localMark = orderId ? localStatusUpdateRef.current[orderId] : null;
          const isLocalEcho = Boolean(
            localMark &&
            localMark.status === nextStatus &&
            Date.now() - localMark.at < 8000
          );

          if (isLocalEcho && orderId) {
            delete localStatusUpdateRef.current[orderId];
          }

          if (orderId && nextStatus && prevStatus && prevStatus !== nextStatus && !isLocalEcho) {
            showAdminToast(
              'Trang thai da doi',
              `#${String(orderId).slice(0, 8).toUpperCase()}: ${prevStatus} -> ${nextStatus}`,
              'success'
            );
          }

          if (orderId && nextStatus) {
            knownStatusRef.current[orderId] = nextStatus;
            setOrders((prev) => prev.map((order) => (
              order.id === orderId ? { ...order, status: nextStatus } : order
            )));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (newOrderAlertTimeoutRef.current) {
        clearTimeout(newOrderAlertTimeoutRef.current);
      }
    };
  }, [fetchOrderById, loadOrders, playNewOrderChime, showAdminToast]);

  useEffect(() => {
    const nextKnown = {};
    orders.forEach((order) => {
      nextKnown[order.id] = order.status;
    });
    knownStatusRef.current = nextKnown;
  }, [orders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    const currentStatus = orders.find((order) => order.id === orderId)?.status;
    if (currentStatus === newStatus) {
      return;
    }

    try {
      setUpdatingId(orderId);
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      localStatusUpdateRef.current[orderId] = {
        status: newStatus,
        at: Date.now(),
      };
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showAdminToast('Cap nhat thanh cong', `Don #${String(orderId).slice(0, 8).toUpperCase()} -> ${newStatus}`, 'info');
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-primary-red mb-4" />
        <h1 className="text-2xl font-display font-black text-gray-900 mb-2">Không thể tải trung tâm điều hành</h1>
        <p className="text-gray-500 max-w-lg mb-6">{error}</p>
        <div className="flex items-center gap-3">
          <button onClick={loadOrders} className="mc-button-primary">Thử lại ngay</button>
          <Link to="/" className="mc-button-secondary">Về Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 animate-fade-in-up">
      {adminToast && (
        <div className="fixed right-6 top-6 z-[120] max-w-sm animate-mc-entry">
          <div className={`rounded-2xl border px-5 py-4 shadow-2xl bg-white ${adminToast.toneClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Realtime Notice</p>
                <p className="text-sm font-black tracking-tight">{adminToast.title}</p>
                <p className="text-xs font-bold opacity-80">{adminToast.message}</p>
              </div>
              <button
                onClick={() => setAdminToast(null)}
                className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200"
              >
                DONG
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="bg-gray-900 rounded-[3rem] p-10 md:p-14 shadow-mc relative overflow-hidden group animate-fade-in-up animate-stagger-1">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-red/20 rounded-full blur-[100px] -mr-32 -mt-32 animate-float-soft"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-yellow/10 rounded-full blur-[80px] -ml-20 -mb-20"></div>
          
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-primary-yellow">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.7)]"></div>
                Live Operations Center
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-none">
                Quản lý <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-yellow to-yellow-600 italic">Đơn hàng</span>
              </h1>
              <p className="text-gray-400 font-medium max-w-xl text-lg leading-relaxed">
                Tối ưu hóa quy trình chế biến và giao hàng với bảng điều khiển McPro thời gian thực.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={loadOrders}
                disabled={loading}
                className="p-5 rounded-3xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-[background-color,transform] duration-200 disabled:opacity-50 group shadow-xl hover:-translate-y-0.5"
              >
                <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
              <div className="px-8 py-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-center shadow-xl">
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-1">Hiện có</span>
                <span className="text-3xl font-display font-black text-primary-yellow leading-none">{filteredOrders.length}</span>
              </div>
              <Link to="/" className="mc-button-primary bg-primary-yellow text-gray-900 hover:bg-yellow-400 px-8">
                QUAY LẠI CỬA HÀNG
              </Link>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-12 bg-black/20 p-2 rounded-[2rem] border border-white/5 inline-flex backdrop-blur-sm">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = filter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-xs transition-[background-color,color,transform,box-shadow] duration-200 uppercase tracking-widest ${
                    isActive 
                      ? `bg-white text-gray-900 shadow-xl scale-105` 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-red' : ''}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* New Order Notification */}
        {newOrderAlert && (
          <div className="bg-primary-yellow text-gray-900 p-6 rounded-[2rem] flex items-center justify-between shadow-2xl animate-mc-entry border-4 border-white ring-4 ring-primary-yellow/20">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-primary-red" />
               </div>
               <div>
                  <h4 className="text-xl font-display font-black uppercase tracking-tighter">MCPRO: ĐƠN HÀNG MỚI VỪA ĐẾN!</h4>
                  <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Kiểm tra ngay để bắt đầu chuẩn bị món ăn</p>
               </div>
            </div>
            <button onClick={() => setNewOrderAlert(false)} className="px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">ĐÃ HIỂU</button>
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="grid gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-[3rem] h-72 animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-gray-100 p-24 text-center shadow-sm">
            <ClipboardList className="mx-auto w-24 h-24 text-gray-100 mb-8" />
            <h3 className="text-2xl font-display font-black text-gray-300 uppercase tracking-tighter">Hiện chưa có đơn hàng nào</h3>
            <button onClick={() => setFilter('all')} className="mt-4 text-primary-red font-black hover:scale-105 transition-transform">XEM TẤT CẢ DANH SÁCH</button>
          </div>
        ) : (
          <div className="grid gap-10 animate-fade-in-up animate-stagger-2">
            {filteredOrders.map((order, index) => (
              <section key={order.id} style={{ animationDelay: `${(index % 5) * 100}ms` }} className="animate-slide-in-up bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm hover:shadow-mc transition-[box-shadow,border-color,transform] duration-300 overflow-hidden group/order relative hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 w-2 h-full bg-primary-yellow opacity-0 group-hover/order:opacity-100 transition-opacity"></div>
                
                <header className="flex flex-wrap items-start justify-between gap-10 border-b border-gray-50 pb-10 mb-10">
                  <div className="space-y-3 flex-1 min-w-[300px]">
                    <div className="flex flex-wrap items-center gap-4">
                      <h2 className="text-3xl font-display font-black text-gray-900 tracking-tighter uppercase">{order.customer_name}</h2>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                        STATUS_OPTIONS.find(o => o.value === order.status)?.color || 'bg-gray-100'
                      }`}>
                        {order.status}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-gray-400">
                      <p className="flex items-center gap-2 tracking-tighter uppercase">
                        <Hash className="w-4 h-4 text-primary-red" /> #{order.id.slice(0, 8)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {new Date(order.created_at).toLocaleString('vi-VN')}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Ship to McAddress
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-4 min-w-[280px]">
                     <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100 w-full shadow-inner">
                      {['pending', 'preparing', 'completed', 'cancelled'].map((st) => (
                        <button
                          key={st}
                          disabled={updatingId === order.id}
                          onClick={() => updateOrderStatus(order.id, st)}
                          className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase transition-[background-color,color,transform,box-shadow] duration-200 ${
                            order.status === st 
                              ? 'bg-white text-gray-900 shadow-xl scale-110 z-10' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                          }`}
                          title={STATUS_OPTIONS.find(o => o.value === st)?.label}
                        >
                          {st.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Tổng thanh toán</p>
                      <p className="text-5xl font-display font-black text-gray-900 tracking-tighter flex items-center justify-end">
                        <span className="text-primary-red text-2xl mr-1 font-bold mb-3">$</span>
                        {Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </header>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(order.order_items || []).map((item) => (
                    <article key={item.id} className="flex items-center gap-5 rounded-[2rem] border border-gray-50 p-5 hover:border-primary-yellow/30 bg-gray-50/50 hover:bg-white transition-[background-color,border-color,box-shadow,transform] duration-300 shadow-sm hover:shadow-xl hover:shadow-gray-200/20 group/item hover:-translate-y-0.5">
                      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-md border-2 border-transparent group-hover/item:border-primary-red/10 transition-all">
                        <img
                          src={item.products?.image_url || '/hero-burger.png'}
                          alt={item.products?.name || 'Product'}
                          className="w-4/5 h-4/5 object-contain drop-shadow-lg group-hover/item:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-black text-base text-gray-900 line-clamp-1 uppercase tracking-tight">{item.products?.name || 'Khác'}</p>
                        <div className="flex items-center gap-3 mt-1.5 font-bold">
                          <span className="bg-primary-red text-white text-[10px] py-1 px-2 rounded-lg">x{item.quantity}</span>
                          <span className="text-sm text-gray-500">${Number(item.price_at_time || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
