import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import { ShoppingCart, Filter, Grid3X3, LayoutList } from 'lucide-react';

export function ShopPage() {
  const { categoryId, subCategoryId } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(categoryId ?? null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { addItem } = useCart();

  useEffect(() => {
    supabase.from('categories').select('*').eq('level', 1).order('display_order').then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (categoryId) {
      setActiveCategory(categoryId);
      supabase.from('categories').select('*').eq('parent_category_id', categoryId).order('display_order').then(({ data }) => setSubCategories(data ?? []));
    }
  }, [categoryId]);

  useEffect(() => {
    setLoading(true);
    let query = supabase.from('products').select('*, seller:sellers(business_name), category:categories(name)').eq('is_active', true);
    if (subCategoryId) query = query.eq('category_id', subCategoryId);
    else if (categoryId) query = query.eq('category_id', categoryId);
    query.order('created_at', { ascending: false }).then(({ data }) => {
      setProducts(data ?? []);
      setLoading(false);
    });
  }, [categoryId, subCategoryId]);

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-neutral-900">Shop</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'text-neutral-400'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-neutral-400'}`}>
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button onClick={() => { setActiveCategory(null); setSubCategories([]); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!activeCategory ? 'bg-emerald-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
          All
        </button>
        {categories.map(cat => (
          <a key={cat.category_id} href={`/shop/category/${cat.category_id}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeCategory === cat.category_id ? 'bg-emerald-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
            {cat.name}
          </a>
        ))}
      </div>

      {/* Subcategory Filters */}
      {subCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {subCategories.map(sub => (
            <a key={sub.category_id} href={`/shop/category/${categoryId}/${sub.category_id}`}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${subCategoryId === sub.category_id ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
              {sub.name}
            </a>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs mt-1">Try a different category</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {products.map(product => (
            <div key={product.product_id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <Link to={`/product/${product.product_id}`} className="aspect-square bg-neutral-100 flex items-center justify-center block">
                {product.image_urls?.[0] ? (
                  <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">📦</span>
                )}
              </Link>
              <div className="p-3">
                <p className="text-[10px] font-medium text-emerald-600 uppercase">{product.category?.name}</p>
                <Link to={`/product/${product.product_id}`} className="block">
                  <h4 className="text-sm font-semibold text-neutral-900 mt-0.5 line-clamp-2 hover:text-emerald-700 transition-colors">{product.name}</h4>
                </Link>
                <p className="text-[10px] text-neutral-500 mt-0.5">by {product.seller?.business_name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-base font-bold text-neutral-900">{formatINR(product.base_price)}</span>
                  <button onClick={() => addItem(product)}
                    className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-sm">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div key={product.product_id} className="bg-white border border-neutral-200 rounded-xl p-3 flex gap-3 shadow-sm">
              <Link to={`/product/${product.product_id}`} className="w-20 h-20 bg-neutral-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {product.image_urls?.[0] ? (
                  <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : <span className="text-2xl">📦</span>}
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-emerald-600 uppercase">{product.category?.name}</p>
                <Link to={`/product/${product.product_id}`}>
                  <h4 className="text-sm font-semibold text-neutral-900 truncate hover:text-emerald-700 transition-colors">{product.name}</h4>
                </Link>
                <p className="text-[10px] text-neutral-500">{product.seller?.business_name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-bold text-neutral-900">{formatINR(product.base_price)}</span>
                  <button onClick={() => addItem(product)}
                    className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
