import { Activity, Box, ClipboardList, LayoutDashboard, Radio, ShieldCheck, Store } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/admin', label: 'Thong ke', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Don hang', icon: ClipboardList },
  { to: '/admin/products', label: 'San pham', icon: Box },
  { to: '/admin/users', label: 'Nguoi dung', icon: ShieldCheck },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1600px] mx-auto flex">
        <aside className="sticky top-0 h-screen w-72 shrink-0 p-5 animate-slide-in-left">
          <div className="h-full rounded-3xl border border-white/50 bg-white/60 backdrop-blur-2xl shadow-xl shadow-gray-300/20 p-5 flex flex-col">
            <div className="flex items-center gap-3 px-2 py-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-primary-red text-primary-yellow font-black text-3xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                M
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Admin Center</p>
                <p className="text-lg font-black text-gray-900">McDelivery PRO</p>
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `interactive-panel flex items-center justify-between px-4 py-3 rounded-2xl font-bold ${
                        isActive
                          ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                      }`
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-widest">
                      <Radio className="w-3 h-3 text-green-500" />
                      Live
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-gray-100 pt-4 px-2">
              <div className="interactive-panel rounded-2xl bg-gray-900 text-white p-4 border border-white/5">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">Store Status</p>
                <p className="mt-1 text-lg font-black flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  Online
                </p>
                <p className="mt-1 text-xs text-gray-400">Realtime monitor dang hoat dong.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0 py-5 pr-5 animate-fade-in-up">
          <div className="mb-4 rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl px-6 py-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">Operations</p>
              <h1 className="text-xl font-black text-gray-900">Quan ly he thong McDelivery</h1>
            </div>
            <NavLink
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:border-gray-400 hover:text-gray-900 transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5"
            >
              <Store className="w-4 h-4" />
              Ve Store
            </NavLink>
          </div>

          <Outlet />
        </section>
      </div>
    </div>
  );
}
