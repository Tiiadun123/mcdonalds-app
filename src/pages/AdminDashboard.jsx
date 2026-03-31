import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Package,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    recentOrders: [],
    revenueHistory: [],
    bestSellers: []
  });
  const [loading, setLoading] = useState(true);

  const buildWeeklyRevenue = (orders = []) => {
    const weekdays = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const now = new Date();
    const labels = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(now.getDate() - offset);
      labels.push({
        key: day.toISOString().slice(0, 10),
        name: weekdays[day.getDay()],
      });
    }

    const sumByDay = orders.reduce((acc, order) => {
      if (order.status === 'cancelled') return acc;

      const date = new Date(order.created_at);
      const key = date.toISOString().slice(0, 10);
      acc[key] = (acc[key] || 0) + Number(order.total_amount || 0);
      return acc;
    }, {});

    return labels.map((entry) => ({
      name: entry.name,
      revenue: Number((sumByDay[entry.key] || 0).toFixed(2)),
    }));
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Total Orders & Revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      // 2. Generate Revenue History from real orders (last 7 days)
      const revenueHistory = buildWeeklyRevenue(orders);

      // 3. Fetch Best Sellers
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, products(name)')
        .limit(100);

      const counts = items?.reduce((acc, item) => {
        const name = item.products?.name || 'Khác';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {}) || {};

      const bestSellers = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        recentOrders: orders.slice(0, 5),
        revenueHistory,
        bestSellers
      });
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const COLORS = ['#DA291C', '#FFC72C', '#272727', '#E5E7EB', '#F9FAFB'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 space-y-10 animate-mc-entry">
      
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-primary-red">
             <TrendingUp className="w-5 h-5 fill-primary-red" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">McAnalytics Dashboard</p>
           </div>
           <h1 className="text-5xl font-display font-black text-gray-900 tracking-tighter uppercase">
             Trình <span className="text-primary-red italic">Quản Trị</span>
           </h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
           <button className="px-6 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">REAL-TIME</button>
          <button className="px-6 py-2 text-gray-400 hover:text-gray-900 rounded-xl text-xs font-black uppercase tracking-widest transition-colors duration-200">HISTORY</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Tổng Doanh Thu', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, trend: '+12.5%', color: 'from-green-500 to-emerald-600' },
          { label: 'Đơn Hàng', value: stats.totalOrders, icon: ShoppingBag, trend: '+5.2%', color: 'from-amber-500 to-orange-600' },
          { label: 'Khách Hàng', value: '1,280', icon: Users, trend: '+8.1%', color: 'from-blue-500 to-indigo-600' },
          { label: 'Tỷ Lệ Chuyển Đổi', value: '24.3%', icon: TrendingUp, trend: '+2.4%', color: 'from-rose-500 to-primary-red' }
        ].map((item, idx) => (
          <div key={idx} className={`interactive-panel bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-mc group hover:-translate-y-1 animate-fade-in-up animate-stagger-${idx + 1}`}>
            <div className="flex items-center justify-between mb-6">
               <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}>
                 <item.icon className="w-6 h-6" />
               </div>
               <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  {item.trend}
               </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
            <h3 className="text-4xl font-display font-black text-gray-900 tracking-tighter">{item.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-gray-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary-red/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
           <div className="relative z-10 space-y-8">
             <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter">Doanh thu tuần này</h3>
                  <p className="text-gray-400 text-sm">Thống kê biến động dòng tiền McPro</p>
                </div>
                <Calendar className="text-primary-yellow w-8 h-8" />
             </div>
             
             <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats.revenueHistory}>
                   <defs>
                     <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#DA291C" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#DA291C" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                   <XAxis 
                     dataKey="name" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 900 }}
                   />
                   <YAxis hide />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '1rem', color: '#fff' }}
                     itemStyle={{ color: '#DA291C', fontWeight: 900 }}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="revenue" 
                     stroke="#DA291C" 
                     strokeWidth={4}
                     fillOpacity={1} 
                     fill="url(#colorRev)" 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-display font-black text-gray-900 uppercase tracking-tighter">Best Sellers</h3>
              <Package className="text-primary-red w-8 h-8" />
           </div>
           
           <div className="space-y-8">
              {stats.bestSellers.map((item, idx) => (
                <div key={idx} className="flex items-center gap-6 group">
                   <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-display font-black text-lg text-gray-300 group-hover:bg-primary-yellow group-hover:text-gray-900 group-hover:border-primary-yellow transition-[background-color,color,border-color,transform] duration-200 group-hover:-translate-y-0.5">
                      {idx + 1}
                   </div>
                   <div className="flex-1">
                      <p className="font-display font-black text-gray-900 group-hover:text-primary-red transition-colors uppercase tracking-tight">{item.name}</p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                         <div 
                           className="h-full bg-primary-yellow transition-all duration-1000" 
                           style={{ width: `${(item.count / stats.bestSellers[0].count) * 100}%` }}
                         ></div>
                      </div>
                   </div>
                   <span className="font-black text-gray-400 text-sm">{item.count}</span>
                </div>
              ))}
           </div>
        </div>

      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-10 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-2xl font-display font-black text-gray-900 uppercase tracking-tighter">Giao dịch gần đây</h3>
            <button className="text-xs font-black uppercase tracking-widest text-primary-red hover:underline">Xem tất cả</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead className="bg-gray-50/50">
                  <tr>
                     <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</th>
                     <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Thời gian</th>
                     <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Số tiền</th>
                     <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {stats.recentOrders.map((order, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                       <td className="px-10 py-6 font-display font-black text-gray-900 uppercase">#{order.id?.slice(0, 8)}</td>
                       <td className="px-10 py-6 text-sm font-medium text-gray-500">
                          {new Date(order.created_at).toLocaleString('vi-VN')}
                       </td>
                       <td className="px-10 py-6 font-display font-black text-xl text-primary-red">
                          ${Number(order.total_amount).toFixed(2)}
                       </td>
                       <td className="px-10 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            order.status === 'completed' ? 'bg-green-100 text-green-600' :
                            order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {order.status}
                          </span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}
