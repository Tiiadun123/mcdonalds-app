import { useEffect, useState } from 'react';
import { supabase, supabaseConfigError } from '../lib/supabase';

export function useMenu() {
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        if (!supabase) {
          throw new Error(supabaseConfigError || 'Supabase chưa được cấu hình.');
        }

        setLoading(true);
        setError(null);

        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (catErr) throw catErr;

        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('*');
        if (prodErr) throw prodErr;

        setCategories(catData || []);
        setProducts(prodData || []);

        if (catData && catData.length > 0) {
          const defaultCategory = catData.find((c) => c.slug === 'burgers') || catData[0];
          setActiveCategoryId(defaultCategory.id);
        }
      } catch (err) {
        console.error('Critical error in useMenu:', err);
        setError(err.message || 'Không thể kết nối với cơ sở dữ liệu.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return {
    activeCategoryId,
    setActiveCategoryId,
    categories,
    products,
    loading,
    error,
  };
}
