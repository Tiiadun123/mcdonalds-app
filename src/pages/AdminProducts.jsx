import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Search, Filter, Image as ImageIcon, AlertTriangle, CheckCircle, ArrowLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    image_url: '',
    description: '',
    is_available: true,
    stock_count: 100
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('categories').select('*').order('name')
      ]);

      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        category_id: product.category_id,
        image_url: product.image_url || '',
        description: product.description || '',
        is_available: product.is_available ?? true,
        stock_count: product.stock_count || 0
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        category_id: categories[0]?.id || '',
        image_url: '',
        description: '',
        is_available: true,
        stock_count: 100
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload]);
        if (error) throw error;
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAvailability = async (product) => {
    try {
      const newStatus = !product.is_available;
      const { error } = await supabase
        .from('products')
        .update({ is_available: newStatus })
        .eq('id', product.id);
      
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: newStatus } : p));
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món này?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 animate-pulse">
           <div className="w-16 h-16 bg-primary-red rounded-full flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
           </div>
           <p className="text-gray-400 font-display font-black uppercase tracking-widest text-sm">Initializing McPro Catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 animate-fade-in-up">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="bg-gray-900 rounded-[3rem] p-10 md:p-14 shadow-mc relative overflow-hidden group animate-fade-in-up animate-stagger-1">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-yellow/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-red/5 rounded-full blur-[80px] -ml-20 -mb-20"></div>
          
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-primary-red">
                 Product Management
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-none">
                Quản lý <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-red to-red-600 italic">Thực đơn</span>
              </h1>
              <p className="text-gray-400 font-medium max-w-xl text-lg leading-relaxed">
                Tạo nên trải nghiệm ẩm thực đẳng cấp. Cập nhật món ăn, hình ảnh và giá cả chỉ trong tích tắc.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/admin" className="p-5 rounded-3xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-[background-color,transform] duration-200 shadow-xl group flex items-center gap-3 font-bold text-sm hover:-translate-y-0.5">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                QUẢN LÝ ĐƠN HÀNG
              </Link>
              <button 
                onClick={() => handleOpenModal()}
                className="mc-button-primary bg-primary-red text-white px-10 h-16 rounded-[1.5rem] flex items-center gap-3 hover:-translate-y-1 hover:shadow-primary-red/50 transition-all"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
                THÊM MÓN MỚI
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-6 px-10 animate-fade-in-up animate-stagger-2">
          <div className="flex items-center gap-6 flex-1 min-w-[300px]">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-red transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm món ăn đẳng cấp..."
                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-red/20 transition-[background-color,border-color] duration-200 font-bold text-gray-900 placeholder:text-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
            <select 
              className="px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-red/20 transition-[background-color,border-color] duration-200 font-black text-gray-600 appearance-none cursor-pointer pr-12 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1.2em' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl">
             <span className="text-[10px] font-black tracking-[0.2em]">{filteredProducts.length}</span>
             <span className="text-[10px] font-black tracking-[0.2em] opacity-40">SẢN PHẨM</span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="group interactive-panel relative bg-white rounded-[2.5rem] border border-gray-100/60 overflow-hidden hover:shadow-mc flex flex-col">
              <div className="relative aspect-square bg-gray-50/50 overflow-hidden p-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                
                <img 
                  src={product.image_url || '/hero-burger.png'} 
                  alt={product.name} 
                  className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 ease-out group-hover:scale-[1.08] group-hover:-rotate-3" 
                />
                
                {/* Action Overlay */}
                <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-[opacity,transform] duration-300">
                  <button 
                    onClick={() => handleOpenModal(product)}
                    className="p-4 bg-white text-gray-900 rounded-2xl shadow-2xl hover:bg-primary-yellow hover:scale-105 active:scale-95 transition-[transform,background-color] duration-200"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-4 bg-primary-red text-white rounded-2xl shadow-2xl hover:bg-red-600 hover:scale-105 active:scale-95 transition-[transform,background-color] duration-200"
                    title="Xóa món"
                  >
                    <Trash2 className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>

                <div className="absolute top-5 left-5 z-20 flex gap-2">
                  <div className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/50 text-[10px] font-black text-gray-900 uppercase tracking-widest shadow-sm">
                    {categories.find(c => c.id === product.category_id)?.name || 'Catalog'}
                  </div>
                  {!product.is_available && (
                    <div className="bg-primary-red text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                      Hết hàng
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 space-y-3 flex-1 flex flex-col">
                <h3 className="font-display font-black text-xl text-gray-900 leading-[1.1] tracking-tighter uppercase group-hover:text-primary-red transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs font-medium text-gray-400 line-clamp-2 leading-relaxed tracking-tight flex-1">
                  {product.description || 'Hương vị tuyệt hảo được chế biến thủ công bởi các chuyên gia McPro.'}
                </p>
                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                   <div className="text-3xl font-display font-black text-gray-900 tracking-tighter">
                      <span className="text-primary-red text-sm mr-0.5 font-bold -translate-y-1 inline-block">$</span>
                      {Number(product.price).toFixed(2)}
                   </div>
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => toggleAvailability(product)}
                         className={`w-12 h-6 rounded-full relative transition-[background-color] duration-300 ${product.is_available ? 'bg-emerald-500' : 'bg-gray-200'}`}
                       >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-[left] duration-300 ${product.is_available ? 'left-7' : 'left-1'}`}></div>
                       </button>
                       <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                         <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-red group-hover:translate-x-1 transition-[color,transform] duration-200" />
                       </div>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-mc overflow-hidden animate-in zoom-in-95 fade-in duration-500 border border-white/20">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-colors z-[110]"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>

            <div className="p-12 md:p-16">
              <div className="mb-10">
                <h2 className="text-4xl font-display font-black text-gray-900 tracking-tighter uppercase mb-2">
                  {editingProduct ? 'Cập nhật' : 'Khởi tạo'} <span className="text-primary-red italic">Món ăn</span>
                </h2>
                <div className="w-20 h-1.5 bg-primary-yellow rounded-full"></div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Tên sản phẩm</label>
                    <input 
                      required
                      placeholder="e.g. McPro Signature Wagyu"
                      className="w-full px-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-primary-red/20 transition-[background-color,border-color] duration-200 font-bold text-gray-900"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Giá niêm yết ($)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      placeholder="9.99"
                      className="w-full px-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-primary-red/20 transition-[background-color,border-color] duration-200 font-bold text-gray-900"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Phân loại</label>
                    <select 
                      required
                      className="w-full px-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-primary-red/20 transition-[background-color,border-color] duration-200 font-bold text-gray-900 cursor-pointer"
                      value={formData.category_id}
                      onChange={e => setFormData({...formData, category_id: e.target.value})}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Image URL</label>
                  <div className="relative">
                     <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                     <input 
                        className="w-full pl-14 pr-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-primary-red/20 transition-[background-color,border-color] duration-200 font-bold text-gray-900"
                        value={formData.image_url}
                        onChange={e => setFormData({...formData, image_url: e.target.value})}
                        placeholder="https://images.mcd.com/..."
                      />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Mô tả chi tiết</label>
                  <textarea 
                    rows="2"
                    placeholder="Describe the taste experience..."
                    className="w-full px-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-primary-red/20 transition-[background-color,border-color] duration-200 font-medium text-gray-700 leading-relaxed"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Sẵn sàng bán</p>
                         <p className="text-[10px] text-gray-400 font-bold">Hiển thị món ăn cho khách</p>
                      </div>
                      <button 
                         type="button"
                         onClick={() => setFormData({...formData, is_available: !formData.is_available})}
                         className={`w-14 h-7 rounded-full relative transition-[background-color] duration-300 ${formData.is_available ? 'bg-emerald-500' : 'bg-gray-300'}`}
                       >
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-[left] duration-300 ${formData.is_available ? 'left-8' : 'left-1'}`}></div>
                       </button>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 ml-2">Số lượng tồn kho</p>
                      <input 
                        type="number"
                        className="w-full bg-white px-4 py-2 rounded-xl border border-gray-200 font-bold"
                        value={formData.stock_count}
                        onChange={e => setFormData({...formData, stock_count: parseInt(e.target.value)})}
                      />
                   </div>
                </div>

                <div className="flex gap-6 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 font-black text-xs text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                  >
                    HỦY BỎ
                  </button>
                  <button 
                    disabled={isSubmitting}
                    className="flex-[2] mc-button-primary bg-gray-900 text-white hover:bg-black rounded-3xl shadow-xl h-16"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ĐANG LƯU...
                      </div>
                    ) : (editingProduct ? 'CẬP NHẬT NGAY' : 'THÊM VÀO THỰC ĐƠN')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ChevronRight = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"></path>
  </svg>
);
