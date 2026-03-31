import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, ShieldCheck, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export function AdminUsers() {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, role, points, updated_at')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProfiles(data || []);
    } catch (err) {
      setError(err.message || 'Khong the tai danh sach nguoi dung.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const visibleProfiles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchRole = filterRole === 'all' || profile.role === filterRole;
      if (!matchRole) return false;

      if (!keyword) return true;

      const searchText = `${profile.full_name || ''} ${profile.id || ''}`.toLowerCase();
      return searchText.includes(keyword);
    });
  }, [profiles, search, filterRole]);

  const updateRole = async (targetProfile, nextRole) => {
    if (!targetProfile?.id || targetProfile.role === nextRole) return;

    if (targetProfile.id === user?.id && nextRole !== 'admin') {
      setError('Khong the tu ha quyen tai khoan admin dang dang nhap.');
      return;
    }

    try {
      setUpdatingId(targetProfile.id);
      setError('');
      setSuccess('');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: nextRole, updated_at: new Date().toISOString() })
        .eq('id', targetProfile.id);

      if (updateError) throw updateError;

      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === targetProfile.id ? { ...profile, role: nextRole } : profile,
        ),
      );

      setSuccess('Cap nhat role thanh cong.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message || 'Khong the cap nhat role.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 space-y-8 animate-fade-in-up">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm animate-fade-in-up animate-stagger-1">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary-red">Admin Access Control</p>
        <h1 className="mt-2 text-4xl font-black text-gray-900">Quan ly tai khoan va role</h1>
        <p className="mt-2 text-gray-500">Cap nhat role admin/customer va theo doi danh sach profile.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 animate-fade-in-up animate-stagger-2">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tim theo ten hoac user id"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-primary-red/40"
            />
          </label>

          <select
            value={filterRole}
            onChange={(event) => setFilterRole(event.target.value)}
            className="px-4 py-3 rounded-2xl border border-gray-200 font-bold text-sm"
          >
            <option value="all">Tat ca role</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>

          <button
            onClick={loadProfiles}
            className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-black text-sm"
          >
            Tai lai
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700 text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-green-700 text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="font-black text-gray-900">Danh sach profile ({visibleProfiles.length})</p>
        </div>

        {loading ? (
          <div className="p-8 text-gray-500 font-bold">Dang tai du lieu...</div>
        ) : visibleProfiles.length === 0 ? (
          <div className="p-8 text-gray-500 font-bold">Khong co profile phu hop.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleProfiles.map((profile) => {
              const isCurrentUser = profile.id === user?.id;
              const isBusy = updatingId === profile.id;

              return (
                <div key={profile.id} className="px-6 py-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-[240px]">
                    <p className="font-black text-gray-900 flex items-center gap-2">
                      <UserRound className="w-4 h-4 text-gray-400" />
                      {profile.full_name || 'Unnamed User'}
                      {isCurrentUser && (
                        <span className="px-2 py-1 rounded-full bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest">
                          Ban
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 font-bold mt-1">ID: {profile.id}</p>
                    <p className="text-xs text-gray-400 font-bold mt-1">Points: {profile.points || 0}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                        profile.role === 'admin'
                          ? 'bg-primary-red/10 text-primary-red'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {profile.role}
                    </span>

                    <button
                      onClick={() => updateRole(profile, 'customer')}
                      disabled={isBusy || (isCurrentUser && profile.role === 'admin')}
                      className="px-4 py-2 rounded-xl border border-gray-200 font-black text-xs uppercase tracking-widest disabled:opacity-40"
                    >
                      Customer
                    </button>

                    <button
                      onClick={() => updateRole(profile, 'admin')}
                      disabled={isBusy}
                      className="px-4 py-2 rounded-xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest disabled:opacity-40 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
