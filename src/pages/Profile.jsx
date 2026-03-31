import { Gift, MapPin, Medal, Phone, Save, Sparkles, Ticket } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/layout/Navbar';
import CartDrawer from '../components/cart/CartDrawer';

const vouchersByRank = {
  Bronze: [
    { code: 'MCBRONZE5', title: 'Giam 5% don tu $10' },
    { code: 'FRIESBONUS', title: 'Tang fries size M' },
  ],
  Silver: [
    { code: 'MCSILVER10', title: 'Giam 10% don tu $15' },
    { code: 'DRINKUP', title: 'Tang 1 do uong bat ky' },
  ],
  Gold: [
    { code: 'MCGOLD15', title: 'Giam 15% don tu $20' },
    { code: 'GOLDCOMBO', title: 'Nang cap combo mien phi' },
    { code: 'VIPDELIVERY', title: 'Mien phi giao hang 2 don' },
  ],
};

function getRank(points) {
  if (points >= 1200) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Bronze';
}

function getNextRankTarget(rank) {
  if (rank === 'Bronze') return 500;
  if (rank === 'Silver') return 1200;
  return 1200;
}

export default function Profile() {
  const { profile, updateProfile } = useAuthStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [phone, setPhone] = useState(null);
  const [address, setAddress] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const resolvedPhone = phone ?? (profile?.phone || '');
  const resolvedAddress = address ?? (profile?.address || '');

  const points = Number(profile?.points || 0);
  const rank = useMemo(() => getRank(points), [points]);
  const nextTarget = useMemo(() => getNextRankTarget(rank), [rank]);
  const progress = useMemo(() => {
    if (rank === 'Gold') return 100;
    const base = rank === 'Bronze' ? 0 : 500;
    return Math.min(100, ((points - base) / (nextTarget - base)) * 100);
  }, [rank, points, nextTarget]);

  const vouchers = vouchersByRank[rank] || vouchersByRank.Bronze;

  const handleSave = async () => {
    const trimmedPhone = resolvedPhone.trim();
    const trimmedAddress = resolvedAddress.trim();

    setSaveError('');
    setSaved(false);

    if (trimmedPhone && !/^[0-9+\s()-]{8,20}$/.test(trimmedPhone)) {
      setSaveError('So dien thoai khong hop le.');
      return;
    }

    if (trimmedAddress.length > 255) {
      setSaveError('Dia chi qua dai (toi da 255 ky tu).');
      return;
    }

    setIsSaving(true);
    const result = await updateProfile({
      phone: trimmedPhone || null,
      address: trimmedAddress || null,
    });

    if (!result.success) {
      setSaveError(result.error?.message || 'Khong the luu settings.');
      setIsSaving(false);
      return;
    }

    setPhone(trimmedPhone);
    setAddress(trimmedAddress);
    setSaved(true);
    setIsSaving(false);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-gray-50/80">
      <Navbar onOpenCart={() => setIsCartOpen(true)} showSearch={false} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <div className="max-w-5xl mx-auto space-y-6 py-8 px-4 md:px-8 animate-mc-entry">
        <div className="interactive-panel bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] font-black text-primary-red">Customer Rewards Center</p>
          <h1 className="mt-2 text-4xl font-black text-gray-900">Xin chao {profile?.full_name || 'Member'}</h1>
          <p className="mt-2 text-gray-500">Theo doi McPoints, hang thanh vien va voucher cua ban.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="interactive-panel md:col-span-2 bg-white rounded-3xl p-7 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-black text-gray-900 text-xl flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary-red" /> Tien do thanh vien</p>
              <span className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-black">{rank}</span>
            </div>
            <p className="mt-4 text-4xl font-black text-gray-900">{points} McPoints</p>
            <div className="mt-5 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-red to-primary-yellow transition-all duration-700" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              {rank === 'Gold' ? 'Ban da dat cap cao nhat Gold.' : `Can them ${Math.max(0, nextTarget - points)} diem de len cap tiep theo.`}
            </p>
          </div>

          <div className="interactive-panel bg-white rounded-3xl p-7 border border-gray-100 shadow-sm">
            <p className="font-black text-gray-900 text-xl flex items-center gap-2"><Medal className="w-5 h-5 text-primary-yellow" /> Hang hien tai</p>
            <p className="mt-4 text-5xl font-black text-primary-red">{rank}</p>
            <p className="mt-2 text-sm text-gray-500">Loi ich duoc mo khoa theo cap bac.</p>
          </div>
        </div>

        <div className="interactive-panel bg-white rounded-3xl p-7 border border-gray-100 shadow-sm">
          <p className="font-black text-gray-900 text-xl flex items-center gap-2"><Ticket className="w-5 h-5 text-primary-red" /> Voucher cua ban</p>
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {vouchers.map((voucher) => (
              <div key={voucher.code} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3 transition-[background-color,border-color,transform] duration-200 hover:bg-white hover:border-primary-yellow/40 hover:-translate-y-0.5">
                <Gift className="w-5 h-5 text-primary-red mt-0.5" />
                <div>
                  <p className="font-black text-gray-900">{voucher.title}</p>
                  <p className="text-sm text-gray-500 mt-1">Code: <span className="font-black text-primary-red">{voucher.code}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="interactive-panel bg-white rounded-3xl p-7 border border-gray-100 shadow-sm">
          <p className="font-black text-gray-900 text-xl">Account Settings</p>
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-bold text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4" /> So dien thoai</span>
              <input
                value={resolvedPhone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhap so dien thoai"
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 font-medium outline-none bg-gray-50/60 focus:bg-white focus:border-primary-red/50 transition-[background-color,border-color] duration-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" /> Dia chi giao hang</span>
              <input
                value={resolvedAddress}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhap dia chi mac dinh"
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 font-medium outline-none bg-gray-50/60 focus:bg-white focus:border-primary-red/50 transition-[background-color,border-color] duration-200"
              />
            </label>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-900 text-white font-black hover:bg-black transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Dang luu...' : 'Luu thay doi'}
          </button>
          {saveError && <p className="mt-3 text-sm text-red-600 font-bold">{saveError}</p>}
          {saved && <p className="mt-3 text-sm text-green-600 font-bold">Da luu settings thanh cong.</p>}
        </div>
      </div>
    </div>
  );
}
