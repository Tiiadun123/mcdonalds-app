import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingBag, Clock, Package, CheckCircle, ChevronRight, AlertCircle, RefreshCw, Star, MapPin, MessageSquare, X, ArrowRight, RotateCcw, ListFilter, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import CartDrawer from '../components/cart/CartDrawer';
import { useCartStore } from '../store/useCartStore';

const STATUS_MAP = {
  'pending': { label: 'Chờ duyệt', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', step: 1, desc: 'McPro đang tiếp nhận đơn hàng của bạn' },
  'preparing': { label: 'Đang nấu', icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-50', step: 2, desc: 'Đầu bếp đang chế biến món ăn đẳng cấp' },
  'completed': { label: 'Đã xong', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', step: 3, desc: 'Chúc bạn ngon miệng với McPro' },
  'cancelled': { label: 'Đã hủy', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', step: 0, desc: 'Đơn hàng đã được hoàn tất hủy' }
};

const getReviewKey = (orderId, productId) => `${orderId || 'na'}::${productId || 'na'}`;
const MY_ORDERS_VIEW_PREFS_KEY = 'mcpro_myorders_view_prefs_v1';

function loadViewPrefs() {
  try {
    const raw = localStorage.getItem(MY_ORDERS_VIEW_PREFS_KEY);
    if (!raw) {
      return { reviewFilter: 'all', sortMode: 'newest' };
    }

    const parsed = JSON.parse(raw);
    return {
      reviewFilter: ['all', 'pending_review', 'fully_reviewed'].includes(parsed?.reviewFilter)
        ? parsed.reviewFilter
        : 'all',
      sortMode: ['newest', 'pending_first', 'low_rating_first'].includes(parsed?.sortMode)
        ? parsed.sortMode
        : 'newest',
    };
  } catch {
    return { reviewFilter: 'all', sortMode: 'newest' };
  }
}

export function MyOrders() {
  const { user } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviewTarget, setSelectedReviewTarget] = useState(null);
  const [reviews, setReviews] = useState({}); // `${order_id}::${product_id}` -> review
  const [reorderingOrderId, setReorderingOrderId] = useState(null);
  const [initialViewPrefs] = useState(() => loadViewPrefs());
  const [reviewFilter, setReviewFilter] = useState(initialViewPrefs.reviewFilter);
  const [sortMode, setSortMode] = useState(initialViewPrefs.sortMode);
  const [statusToast, setStatusToast] = useState(null);
  const statusByOrderRef = useRef({});
  const toastTimeoutRef = useRef(null);

  const showStatusToast = useCallback((orderId, nextStatus) => {
    const statusMeta = STATUS_MAP[nextStatus] || STATUS_MAP.pending;
    setStatusToast({
      orderId,
      status: nextStatus,
      label: statusMeta.label,
      color: statusMeta.color,
      bg: statusMeta.bg,
    });

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setStatusToast(null);
    }, 4500);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [ordersResult, reviewsResult] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            id,
            status,
            total_amount,
            created_at,
            delivery_address,
            payment_method,
            payment_status,
            payment_ref,
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
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('order_id, product_id, rating, comment')
          .eq('user_id', user.id),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (reviewsResult.error) throw reviewsResult.error;

      const orderData = ordersResult.data || [];
      const reviewData = reviewsResult.data || [];
      setOrders(orderData);

      const reviewMap = {};
      const legacyReviewByOrder = {};

      reviewData.forEach((r) => {
        if (r.order_id && r.product_id) {
          reviewMap[getReviewKey(r.order_id, r.product_id)] = r;
          return;
        }

        if (r.order_id && !r.product_id) {
          legacyReviewByOrder[r.order_id] = r;
        }
      });

      if (orderData.length) {
        orderData.forEach((order) => {
          const firstProductId = order.order_items?.[0]?.products?.id;
          const legacyOrderReview = legacyReviewByOrder[order.id];
          if (legacyOrderReview && firstProductId) {
            reviewMap[getReviewKey(order.id, firstProductId)] = {
              ...legacyOrderReview,
              product_id: firstProductId,
            };
          }
        });
      }

      setReviews(reviewMap);
    } catch (err) {
      console.error('MyOrders fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchOrders();

    const channel = supabase
      .channel('my_orders_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const nextOrder = payload?.new;
          const orderId = nextOrder?.id;
          const nextStatus = nextOrder?.status;
          const prevStatusFromPayload = payload?.old?.status;
          const prevStatus = prevStatusFromPayload || (orderId ? statusByOrderRef.current[orderId] : null);

          if (!orderId || !nextStatus) {
            return;
          }

          if (prevStatus && prevStatus !== nextStatus) {
            showStatusToast(orderId, nextStatus);
          }

          statusByOrderRef.current[orderId] = nextStatus;
          setOrders((prevOrders) => prevOrders.map((order) => (
            order.id === orderId ? { ...order, status: nextStatus } : order
          )));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [user, fetchOrders, showStatusToast]);

  useEffect(() => {
    const statusMap = {};
    orders.forEach((order) => {
      statusMap[order.id] = order.status;
    });
    statusByOrderRef.current = statusMap;
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(
        MY_ORDERS_VIEW_PREFS_KEY,
        JSON.stringify({ reviewFilter, sortMode })
      );
    } catch {
      // Ignore storage write failures (e.g. private mode/quota exceeded).
    }
  }, [reviewFilter, sortMode]);

  const handleReviewSubmit = async (rating, comment) => {
    try {
      if (!selectedReviewTarget) return;
      const payload = {
        order_id: selectedReviewTarget.orderId,
        product_id: selectedReviewTarget.productId,
        user_id: user.id,
        rating,
        comment,
      };

      let { error } = await supabase
        .from('reviews')
        .upsert([payload], { onConflict: 'order_id,product_id,user_id' });

      if (error?.message?.includes('order_id') && error?.message?.includes('user_id')) {
        const legacyOrderKey = await supabase
          .from('reviews')
          .upsert([payload], { onConflict: 'order_id,user_id' });
        error = legacyOrderKey.error;
      }

      if (error?.message?.includes('order_id')) {
        const fallbackPayload = {
          product_id: selectedReviewTarget.productId,
          user_id: user.id,
          rating,
          comment,
        };
        const fallback = await supabase
          .from('reviews')
          .upsert([fallbackPayload], { onConflict: 'product_id,user_id' });
        error = fallback.error;
      }

      if (error) throw error;
      
      setReviews(prev => ({
        ...prev,
        [getReviewKey(selectedReviewTarget.orderId, selectedReviewTarget.productId)]: {
          rating,
          comment,
          product_id: selectedReviewTarget.productId,
          order_id: selectedReviewTarget.orderId,
        }
      }));
      setSelectedReviewTarget(null);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const openReviewForItem = (order, item) => {
    if (!item?.products?.id) return;
    const reviewKey = getReviewKey(order.id, item.products.id);
    const existingReview = reviews[reviewKey] || null;

    setSelectedReviewTarget({
      orderId: order.id,
      productId: item.products.id,
      productName: item.products.name,
      existingReview,
    });
  };

  const handleReorder = async (order) => {
    const validItems = (order?.order_items || []).filter((item) => item?.products?.id);

    if (validItems.length === 0) {
      alert('Khong the mua lai vi san pham trong don cu khong con ton tai.');
      return;
    }

    try {
      setReorderingOrderId(order.id);
      clearCart();

      validItems.forEach((item) => {
        const productPayload = {
          ...item.products,
          id: item.products.id,
          image: item.products.image_url,
          image_url: item.products.image_url,
          price: Number(item.price_at_time ?? item.products.price ?? 0),
        };

        for (let i = 0; i < item.quantity; i += 1) {
          addItem(productPayload);
        }
      });

      setIsCartOpen(true);
    } finally {
      setReorderingOrderId(null);
    }
  };

  const resetViewPrefs = () => {
    setReviewFilter('all');
    setSortMode('newest');
    try {
      localStorage.removeItem(MY_ORDERS_VIEW_PREFS_KEY);
    } catch {
      // Ignore storage failures and keep in-memory reset behavior.
    }
  };

  const getOrderReviewMeta = useCallback((order) => {
    const reviewableItems = (order.order_items || []).filter((item) => item?.products?.id);
    const reviewedCount = reviewableItems.filter((item) => {
      const key = getReviewKey(order.id, item.products.id);
      return Boolean(reviews[key]);
    }).length;
    const orderReviewRatings = reviewableItems
      .map((item) => reviews[getReviewKey(order.id, item.products.id)]?.rating)
      .filter((rating) => typeof rating === 'number');
    const averageRatingValue = orderReviewRatings.length
      ? Number((orderReviewRatings.reduce((sum, rating) => sum + rating, 0) / orderReviewRatings.length).toFixed(1))
      : 0;
    const averageRatingStars = Math.round(averageRatingValue);
    const firstPendingReviewItem = reviewableItems.find((item) => {
      const key = getReviewKey(order.id, item.products.id);
      return !reviews[key];
    });

    return {
      reviewableItems,
      reviewedCount,
      averageRatingValue,
      averageRatingStars,
      firstPendingReviewItem,
    };
  }, [reviews]);

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.status !== 'cancelled'),
    [orders]
  );
  const reviewFilterCounts = useMemo(() => {
    let pending = 0;
    let reviewed = 0;

    visibleOrders.forEach((order) => {
      const { reviewableItems, reviewedCount } = getOrderReviewMeta(order);
      if (reviewableItems.length === 0) return;

      if (reviewedCount < reviewableItems.length) {
        pending += 1;
      } else {
        reviewed += 1;
      }
    });

    return {
      all: visibleOrders.length,
      pending,
      reviewed,
    };
  }, [getOrderReviewMeta, visibleOrders]);

  const filteredVisibleOrders = useMemo(() => {
    if (reviewFilter === 'all') return visibleOrders;

    return visibleOrders.filter((order) => {
      const { reviewableItems, reviewedCount } = getOrderReviewMeta(order);
      if (reviewableItems.length === 0) return false;

      if (reviewFilter === 'pending_review') {
        return reviewedCount < reviewableItems.length;
      }

      if (reviewFilter === 'fully_reviewed') {
        return reviewedCount === reviewableItems.length;
      }

      return true;
    });
  }, [getOrderReviewMeta, reviewFilter, visibleOrders]);

  const sortedVisibleOrders = useMemo(() => {
    const nextOrders = [...filteredVisibleOrders];

    if (sortMode === 'newest') {
      return nextOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (sortMode === 'pending_first') {
      return nextOrders.sort((a, b) => {
        const aMeta = getOrderReviewMeta(a);
        const bMeta = getOrderReviewMeta(b);
        const aPending = aMeta.reviewableItems.length > 0 && aMeta.reviewedCount < aMeta.reviewableItems.length;
        const bPending = bMeta.reviewableItems.length > 0 && bMeta.reviewedCount < bMeta.reviewableItems.length;
        if (aPending !== bPending) return aPending ? -1 : 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    if (sortMode === 'low_rating_first') {
      return nextOrders.sort((a, b) => {
        const aMeta = getOrderReviewMeta(a);
        const bMeta = getOrderReviewMeta(b);
        const aScore = aMeta.averageRatingValue || 999;
        const bScore = bMeta.averageRatingValue || 999;
        if (aScore !== bScore) return aScore - bScore;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    return nextOrders;
  }, [filteredVisibleOrders, getOrderReviewMeta, sortMode]);

  const reviewFilterMeta = useMemo(() => {
    if (reviewFilter === 'pending_review') {
      return {
        label: 'Chua danh gia xong',
        classes: 'border-primary-yellow/50 bg-primary-yellow/20 text-primary-yellow',
      };
    }

    if (reviewFilter === 'fully_reviewed') {
      return {
        label: 'Da danh gia xong',
        classes: 'border-emerald-300/50 bg-emerald-100/15 text-emerald-200',
      };
    }

    return {
      label: 'Tat ca',
      classes: 'border-white/20 bg-white/10 text-white',
    };
  }, [reviewFilter]);

  const sortModeMeta = useMemo(() => {
    if (sortMode === 'pending_first') {
      return {
        label: 'Uu tien chua danh gia',
        classes: 'border-primary-yellow/50 bg-primary-yellow/20 text-primary-yellow',
      };
    }

    if (sortMode === 'low_rating_first') {
      return {
        label: 'Diem thap truoc',
        classes: 'border-rose-300/50 bg-rose-100/15 text-rose-200',
      };
    }

    return {
      label: 'Moi nhat',
      classes: 'border-white/20 bg-white/10 text-white',
    };
  }, [sortMode]);

  const hasCustomView = reviewFilter !== 'all' || sortMode !== 'newest';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar onOpenCart={() => setIsCartOpen(true)} showSearch={false} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-10">
          <div className="h-64 bg-gray-200 rounded-[3rem] animate-pulse"></div>
          <div className="space-y-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white border border-gray-100 rounded-[3rem] animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-mc-entry">
      {statusToast && (
        <div className="fixed top-6 right-6 z-[120] max-w-sm animate-mc-entry">
          <div className={`rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-2xl`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order Update</p>
                <p className="text-sm font-bold text-gray-800">
                  Don #{statusToast.orderId.slice(0, 8).toUpperCase()} da chuyen sang trang thai
                </p>
                <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusToast.bg} ${statusToast.color}`}>
                  {statusToast.label}
                </span>
              </div>
              <button
                onClick={() => setStatusToast(null)}
                className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200"
              >
                Dong
              </button>
            </div>
          </div>
        </div>
      )}
      <Navbar onOpenCart={() => setIsCartOpen(true)} showSearch={false} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <div className="max-w-5xl mx-auto space-y-10 p-6 md:p-12 animate-fade-in-up animate-stagger-1">
        
        {/* Header Section */}
        <div className="bg-gray-900 rounded-[3rem] p-10 md:p-14 shadow-mc relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-red/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-yellow/5 rounded-full blur-[80px] -ml-20 -mb-20"></div>
          
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-10">
            <div className="space-y-4 animate-fade-in-up animate-stagger-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-primary-yellow">
                 Ordering History
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-none">
                Đơn hàng <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-red to-red-600 italic">của tôi</span>
              </h1>
              <p className="text-gray-400 font-medium max-w-xl text-lg leading-relaxed">
                Theo dõi tiến độ đơn hàng và lịch sử trải nghiệm ẩm thực McPro của bạn.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-stagger-3">
              <Link to="/" className="mc-button-primary bg-primary-yellow text-gray-900 hover:bg-yellow-400 px-10 h-16 flex items-center gap-3">
                TIẾP TỤC MUA SẮM
                <ChevronRight className="w-5 h-5" />
              </Link>
              <button
                onClick={fetchOrders}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 hover:bg-white/10 bg-white/5 px-6 h-16 text-[10px] font-black uppercase tracking-widest text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Lam moi lich su
              </button>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2">
            <button
              onClick={() => setReviewFilter('all')}
              className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                reviewFilter === 'all' ? 'bg-white text-gray-900' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Tat ca ({reviewFilterCounts.all})
            </button>
            <button
              onClick={() => setReviewFilter('pending_review')}
              className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                reviewFilter === 'pending_review' ? 'bg-primary-yellow text-gray-900' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Chua danh gia xong ({reviewFilterCounts.pending})
            </button>
            <button
              onClick={() => setReviewFilter('fully_reviewed')}
              className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                reviewFilter === 'fully_reviewed' ? 'bg-emerald-200 text-gray-900' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Da danh gia xong ({reviewFilterCounts.reviewed})
            </button>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2">
            <button
              onClick={() => setSortMode('newest')}
              className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                sortMode === 'newest' ? 'bg-white text-gray-900' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Moi nhat
            </button>
            <button
              onClick={() => setSortMode('pending_first')}
              className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                sortMode === 'pending_first' ? 'bg-primary-yellow text-gray-900' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Uu tien chua danh gia
            </button>
            <button
              onClick={() => setSortMode('low_rating_first')}
              className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                sortMode === 'low_rating_first' ? 'bg-rose-200 text-gray-900' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Diem thap truoc
            </button>
            <button
              onClick={resetViewPrefs}
              className="px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/10"
            >
              Reset bo loc
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-200">
              View dang ap dung
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${reviewFilterMeta.classes}`}>
              <ListFilter key={`filter-icon-${reviewFilter}`} className="h-3.5 w-3.5 animate-mc-entry" />
              Bo loc: {reviewFilterMeta.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${sortModeMeta.classes}`}>
              <ArrowUpDown key={`sort-icon-${sortMode}`} className="h-3.5 w-3.5 animate-mc-entry" />
              Sap xep: {sortModeMeta.label}
            </span>
            {hasCustomView ? (
              <span className="rounded-full border border-primary-yellow/60 bg-primary-yellow/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-yellow">
                Tuy chinh
              </span>
            ) : (
              <span className="rounded-full border border-emerald-300/40 bg-emerald-100/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                Mac dinh
              </span>
            )}
          </div>
        </div>

        {filteredVisibleOrders.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] p-24 text-center border border-gray-100 shadow-sm">
            <ShoppingBag className="w-24 h-24 text-gray-100 mx-auto mb-8 animate-bounce-custom" />
            <h3 className="text-3xl font-display font-black text-gray-300 uppercase tracking-tighter mb-4">
              {reviewFilter === 'all' ? 'Bạn chưa có đơn hàng nào' : 'Khong co don hang phu hop bo loc'}
            </h3>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">
              {reviewFilter === 'all'
                ? 'Hãy để McPro đánh thức vị giác của bạn ngay bây giờ!'
                : 'Thu doi bo loc hoac tiep tuc dat hang de trai nghiem them mon moi.'}
            </p>
            <Link to="/" className="mc-button-primary px-12 h-14 rounded-2xl">
              KHÁM PHÁ THỰC ĐƠN NGAY
            </Link>
            {reviewFilter !== 'all' && (
              <button
                onClick={() => setReviewFilter('all')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2 text-xs font-black uppercase tracking-widest text-gray-700"
              >
                XEM TAT CA DON
              </button>
            )}
            <button
              onClick={fetchOrders}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2 text-xs font-black uppercase tracking-widest text-gray-700"
            >
              <RefreshCw className="w-4 h-4" /> Lam moi lich su
            </button>
          </div>
        ) : (
          <div className="grid gap-10 animate-fade-in-up animate-stagger-2">
            {sortedVisibleOrders.map((order, idx) => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const {
                reviewableItems,
                reviewedCount,
                averageRatingValue,
                averageRatingStars,
                firstPendingReviewItem,
              } = getOrderReviewMeta(order);
              return (
                <div key={order.id} style={{ animationDelay: `${(idx % 5) * 100}ms` }} className="group relative bg-white rounded-[3rem] border border-gray-100/60 overflow-hidden shadow-sm hover:shadow-mc transition-all duration-700 animate-slide-in-up">
                   <div className="absolute top-0 right-0 w-2 h-full bg-primary-yellow opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   
                  <div className="p-8 md:p-12 space-y-10">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-6 border-b border-gray-50 pb-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-primary-red">
                           <Star className="w-5 h-5 fill-primary-red" />
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-none">Order Details</p>
                        </div>
                        <h3 className="text-3xl font-display font-black text-gray-900 tracking-tighter uppercase">
                           #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm font-medium text-gray-400 flex items-center gap-2">
                           <Clock className="w-4 h-4" /> {new Date(order.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3 min-w-[200px]">
                        <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl ${status.bg} ${status.color} border border-current/10`}>
                          <status.icon className={`w-5 h-5 ${order.status === 'preparing' ? 'animate-spin' : ''}`} />
                          <span className="font-display font-black text-sm uppercase tracking-widest">{status.label}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 text-right">{status.desc}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {order.status !== 'cancelled' && (
                       <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-gray-100/50 relative overflow-hidden">
                          <div className="relative z-10">
                            <div className="absolute top-[1.2rem] left-0 w-full h-1 bg-gray-200 rounded-full"></div>
                            <div 
                              className="absolute top-[1.2rem] left-0 h-1 bg-primary-red rounded-full transition-all duration-1000 shadow-[0_0_15px_#DA291C]"
                              style={{ width: `${(status.step / 3) * 100}%` }}
                            ></div>
                            <div className="relative flex justify-between items-center">
                              {[1, 2, 3].map((s) => (
                                <div key={s} className="flex flex-col items-center gap-4">
                                  <div className={`w-10 h-10 rounded-2xl border-4 transition-all duration-700 z-10 flex items-center justify-center ${
                                    status.step >= s 
                                      ? 'bg-primary-red border-white shadow-xl scale-125 rotate-3' 
                                      : 'bg-white border-gray-100'
                                  }`}>
                                     {status.step > s ? (
                                        <CheckCircle className="w-5 h-5 text-white" />
                                     ) : (
                                        <div className={`w-2 h-2 rounded-full ${status.step === s ? 'bg-white animate-pulse' : 'bg-gray-100'}`}></div>
                                     )}
                                  </div>
                                  <div className="text-center">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${
                                      status.step >= s ? 'text-gray-900' : 'text-gray-300'
                                    }`}>
                                      {s === 1 ? 'Chờ duyệt' : s === 2 ? 'Đang nấu' : 'Đã xong'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                      </div>
                    )}

                    {/* Items & Footer */}
                    <div className="flex flex-wrap items-center gap-10">
                      <div className="flex -space-x-6">
                        {(order.order_items || []).map((item, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-3xl bg-white border-4 border-gray-50 overflow-hidden shadow-xl hover:translate-y-[-10px] transition-transform duration-500 z-[10]">
                            <img 
                              src={item.products?.image_url || '/hero-burger.png'} 
                              alt="" 
                              className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" 
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-lg font-display font-black text-gray-900 uppercase tracking-tight line-clamp-1 mb-1">
                          {(order.order_items || []).map(i => i.products?.name || 'San pham khong con').join(', ')}
                        </p>
                        <div className="flex items-center gap-4">
                           <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                             <Package className="w-4 h-4" /> {(order.order_items || []).length} SẢN PHẨM
                           </span>
                           <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                               <MapPin className="w-4 h-4" /> {order.delivery_address || 'Chua cap nhat dia chi'}
                           </span>
                        </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                              Payment: {order.payment_method || 'cash'}
                            </span>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                              Status: {order.payment_status || 'pending'}
                            </span>
                            {order.payment_ref && (
                              <span className="rounded-full bg-primary-yellow/20 px-3 py-1 text-gray-700">
                                Ref: {order.payment_ref}
                              </span>
                            )}
                          </div>
                          {order.status === 'completed' && reviewableItems.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {reviewableItems.map((item) => {
                                const reviewKey = getReviewKey(order.id, item.products.id);
                                const reviewed = reviews[reviewKey];

                                return (
                                  <button
                                    key={reviewKey}
                                    onClick={() => openReviewForItem(order, item)}
                                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                      reviewed
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary-red/30'
                                    }`}
                                  >
                                    {reviewed
                                      ? `Da danh gia: ${item.products.name}`
                                      : `Danh gia: ${item.products.name}`}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                      </div>

                      <div className="text-right space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1">Tổng thanh toán</p>
                          <div className="text-5xl font-display font-black text-gray-900 tracking-tighter flex items-center justify-end">
                            <span className="text-primary-red text-2xl mr-1 font-bold mb-3">$</span>
                            {Number(order.total_amount).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleReorder(order)}
                            disabled={reorderingOrderId === order.id}
                            className="mc-button-secondary bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 px-4 h-12 text-[10px] rounded-xl flex items-center gap-2"
                          >
                            <RotateCcw className={`w-4 h-4 ${reorderingOrderId === order.id ? 'animate-spin' : ''}`} />
                            {reorderingOrderId === order.id ? 'DANG NAP GIO' : 'MUA LAI'}
                          </button>
                        {order.status === 'completed' && (
                          <div className="flex justify-end">
                            {reviewableItems.length > 0 && reviewedCount === reviewableItems.length ? (
                              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`w-3.5 h-3.5 ${s <= averageRatingStars ? 'text-primary-yellow fill-primary-yellow' : 'text-gray-200'}`} />
                                  ))}
                                </div>
                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                                  {averageRatingValue.toFixed(1)}/5
                                </span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Da danh gia {reviewedCount}/{reviewableItems.length} mon</span>
                              </div>
                            ) : reviewableItems.length > 0 ? (
                              <button 
                                onClick={() => openReviewForItem(order, firstPendingReviewItem)}
                                className="mc-button-primary bg-gray-900 text-white hover:bg-black px-6 h-12 text-[10px] rounded-xl flex items-center gap-2"
                              >
                                <Star className="w-4 h-4 fill-primary-yellow text-primary-yellow" />
                                DANH GIA MON TIEP THEO ({reviewedCount}/{reviewableItems.length})
                              </button>
                            ) : null}
                            {reviewableItems.length === 0 && (
                              <div className="rounded-xl border border-gray-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                KHONG CO MON DE DANH GIA
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedReviewTarget && (
        <ReviewModal 
          key={`${selectedReviewTarget.orderId}:${selectedReviewTarget.productId}`}
          productName={selectedReviewTarget.productName}
          initialRating={selectedReviewTarget.existingReview?.rating}
          initialComment={selectedReviewTarget.existingReview?.comment}
          isEditing={Boolean(selectedReviewTarget.existingReview)}
          onClose={() => { setSelectedReviewTarget(null); }} 
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}

function ReviewModal({ onClose, onSubmit, productName, initialRating, initialComment, isEditing }) {
  const [rating, setRating] = useState(initialRating || 5);
  const [comment, setComment] = useState(initialComment || '');
  const [hover, setHover] = useState(0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-mc overflow-hidden animate-in zoom-in-95 fade-in duration-500 border border-white/20 p-12">
        <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-gray-400" />
        </button>

        <div className="text-center space-y-8">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-yellow/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary-red">
                 Share Your McExperience
              </div>
              <h2 className="text-4xl font-display font-black text-gray-900 tracking-tighter uppercase italic leading-none">
                Đánh giá <span className="text-primary-red">Đơn hàng</span>
              </h2>
              {productName && (
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                  San pham: {productName}
                </p>
              )}
           </div>

           <div className="flex flex-col items-center gap-4">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">Bạn cảm thấy món ăn thế nào?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="p-1 transition-all duration-300"
                  >
                    <Star 
                      className={`w-10 h-10 transition-all ${
                        (hover || rating) >= star 
                          ? 'text-primary-yellow fill-primary-yellow scale-125' 
                          : 'text-gray-100 fill-gray-50 bg-transparent'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <div className="h-6">
                <span className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] animate-mc-entry">
                  {rating === 5 ? 'Tuyệt đỉnh McPro!' : rating === 4 ? 'Rất ngon' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Cần cải thiện' : 'Thất vọng'}
                </span>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex items-center gap-2 ml-4">
                 <MessageSquare className="w-4 h-4 text-gray-400" />
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lời nhắn cho đầu bếp</label>
              </div>
              <textarea 
                rows="3"
                placeholder="Món Burger Wagyu của bạn thật sự rất tuyệt..."
                className="w-full px-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary-red/20 transition-all font-medium text-gray-700 leading-relaxed shadow-inner"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
           </div>

           <button 
             onClick={() => onSubmit(rating, comment)}
             className="mc-button-primary w-full h-20 bg-gray-900 text-white hover:bg-black rounded-3xl shadow-xl flex items-center justify-center gap-3"
           >
              {isEditing ? 'CAP NHAT DANH GIA' : 'GUI DANH GIA NGAY'}
              <ArrowRight className="w-5 h-5 flex stroke-[3]" />
           </button>
        </div>
      </div>
    </div>
  );
}
