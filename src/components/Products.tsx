import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Zap, 
  ExternalLink, 
  Package,
  TrendingUp,
  Target,
  DollarSign,
  Clock,
  CheckCircle2,
  X,
  Megaphone
} from 'lucide-react';
import { Card, Button, Input } from './ui/Common';
import { Product, MarketingContent } from '../types';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { agentService } from '../services/agentService';
import ReactMarkdown from 'react-markdown';

interface ProductsProps {
  user: any;
  onGenerateMarketing: (product: Product) => void;
}

export default function Products({ user, onGenerateMarketing }: ProductsProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedProductInsights, setSelectedProductInsights] = React.useState<Product | null>(null);
  const [marketingInsights, setMarketingInsights] = React.useState<MarketingContent | null>(null);
  const [loadingInsights, setLoadingInsights] = React.useState(false);

  React.useEffect(() => {
    if (!selectedProductInsights) {
      setMarketingInsights(null);
      return;
    }

    setLoadingInsights(true);
    const q = query(
      collection(db, 'marketingContent'),
      where('competitorId', '==', 'product-' + selectedProductInsights.id),
      orderBy('generatedAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setMarketingInsights({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as MarketingContent);
      } else {
        setMarketingInsights(null);
      }
      setLoadingInsights(false);
    }, (error) => {
      console.error('Error fetching insights:', error);
      setLoadingInsights(false);
    });

    return () => unsubscribe();
  }, [selectedProductInsights]);

  // Form State
  const [formData, setFormData] = React.useState({
    name: '',
    category: '',
    description: '',
    price: '',
    discountPrice: '',
    features: '',
    imageUrl: '',
    websiteUrl: '',
    targetMarket: '',
    marketingGoal: 'Increase sales',
    campaignBudget: '',
    campaignDuration: '',
    marketingChannels: [] as string[]
  });

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'products'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async (e: React.FormEvent, generateMarketing: boolean = false) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const productData = {
        userId: user.uid,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        features: formData.features.split('\n').filter(f => f.trim()),
        imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.name}/400/400`,
        websiteUrl: formData.websiteUrl,
        targetMarket: formData.targetMarket,
        marketingGoal: formData.marketingGoal,
        campaignBudget: formData.campaignBudget ? parseFloat(formData.campaignBudget) : null,
        campaignDuration: formData.campaignDuration,
        marketingChannels: formData.marketingChannels,
        campaignStatus: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      let productId = '';
      if (editingProduct) {
        productId = editingProduct.id;
        await updateDoc(doc(db, 'products', productId), productData);
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        productId = docRef.id;
      }

      if (generateMarketing) {
        const product = { id: productId, ...productData } as Product;
        await agentService.generateProductMarketing(product);
        onGenerateMarketing(product);
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      discountPrice: '',
      features: '',
      imageUrl: '',
      websiteUrl: '',
      targetMarket: '',
      marketingGoal: 'Increase sales',
      campaignBudget: '',
      campaignDuration: '',
      marketingChannels: []
    });
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString() || '',
      features: product.features.join('\n'),
      imageUrl: product.imageUrl || '',
      websiteUrl: product.websiteUrl || '',
      targetMarket: product.targetMarket || '',
      marketingGoal: product.marketingGoal,
      campaignBudget: product.campaignBudget?.toString() || '',
      campaignDuration: product.campaignDuration || '',
      marketingChannels: product.marketingChannels
    });
    setIsModalOpen(true);
  };

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      marketingChannels: prev.marketingChannels.includes(channel)
        ? prev.marketingChannels.filter(c => c !== channel)
        : [...prev.marketingChannels, channel]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-gray-500 mt-1">Manage your products and generate AI-driven marketing campaigns.</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingProduct(null); setIsModalOpen(true); }} className="h-12 px-6">
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Products', value: products.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Campaigns', value: products.filter(p => p.campaignStatus === 'active').length, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Marketing Goals Met', value: '84%', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input className="pl-10" placeholder="Search products..." />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-black/5">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Last Action</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products added yet. Click "Add Product" to get started.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-black/5">
                          <img 
                            src={product.imageUrl || `https://picsum.photos/seed/${product.name}/100/100`} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">${product.price}</span>
                        {product.discountPrice && (
                          <span className="text-xs text-emerald-600 font-medium">Promo: ${product.discountPrice}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          product.campaignStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 
                          product.campaignStatus === 'completed' ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <span className="text-sm font-medium capitalize">{product.campaignStatus}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.lastMarketingAction || 'No actions yet'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedProductInsights(product)}>
                          <Zap className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(product)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onGenerateMarketing(product)}>
                          <Megaphone className="w-4 h-4 mr-2" />
                          Market
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                  <p className="text-sm text-gray-500">Fill in the details to enable AI marketing generation.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-black/5 pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Product Name</label>
                      <Input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Wireless Earbuds Pro"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Category</label>
                      <Input 
                        required
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        placeholder="e.g. Electronics"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Description</label>
                    <textarea 
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl text-sm focus:ring-2 focus:ring-black/5 transition-all min-h-[100px]"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe your product features and benefits..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Regular Price ($)</label>
                      <Input 
                        required
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Discount Price ($) - Optional</label>
                      <Input 
                        type="number"
                        value={formData.discountPrice}
                        onChange={e => setFormData({...formData, discountPrice: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Features & Media */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-black/5 pb-2">Features & Media</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Key Features (One per line)</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl text-sm focus:ring-2 focus:ring-black/5 transition-all min-h-[100px]"
                      value={formData.features}
                      onChange={e => setFormData({...formData, features: e.target.value})}
                      placeholder="Noise Cancellation&#10;24h Battery Life&#10;Waterproof IPX7"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Product Image URL</label>
                      <Input 
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Website URL</label>
                      <Input 
                        value={formData.websiteUrl}
                        onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                        placeholder="https://example.com/product"
                      />
                    </div>
                  </div>
                </div>

                {/* Marketing Settings */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-black/5 pb-2">Marketing Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Target Market</label>
                      <Input 
                        value={formData.targetMarket}
                        onChange={e => setFormData({...formData, targetMarket: e.target.value})}
                        placeholder="e.g. Young Professionals, Tech Enthusiasts"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Marketing Goal</label>
                      <select 
                        className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl text-sm focus:ring-2 focus:ring-black/5 transition-all"
                        value={formData.marketingGoal}
                        onChange={e => setFormData({...formData, marketingGoal: e.target.value})}
                      >
                        <option>Increase sales</option>
                        <option>Promote new product</option>
                        <option>Launch campaign</option>
                        <option>Seasonal promotion</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Campaign Budget ($)</label>
                      <Input 
                        type="number"
                        value={formData.campaignBudget}
                        onChange={e => setFormData({...formData, campaignBudget: e.target.value})}
                        placeholder="500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Campaign Duration</label>
                      <Input 
                        value={formData.campaignDuration}
                        onChange={e => setFormData({...formData, campaignDuration: e.target.value})}
                        placeholder="e.g. 2 weeks, 1 month"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 block">Preferred Marketing Channels</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Social Media', 'Email Marketing', 'Google Ads', 'Website Promotion'].map(channel => (
                        <label key={channel} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-black/5 cursor-pointer hover:bg-gray-100 transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                            checked={formData.marketingChannels.includes(channel)}
                            onChange={() => toggleChannel(channel)}
                          />
                          <span className="text-xs font-medium">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </form>

              <div className="p-6 border-t border-black/5 bg-gray-50/50 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={(e) => handleSave(e)} disabled={loading}>
                  {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={(e) => handleSave(e, true)} disabled={loading}>
                  <Zap className="w-4 h-4 mr-2" />
                  {editingProduct ? 'Update & Generate' : 'Save & Generate Strategy'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Insights Side Panel */}
      <AnimatePresence>
        {selectedProductInsights && (
          <>
            <div className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-sm" onClick={() => setSelectedProductInsights(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 z-[120] w-full max-w-2xl bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                    <Zap className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Marketing Insights</h2>
                    <p className="text-sm text-gray-500">{selectedProductInsights.name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProductInsights(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {loadingInsights ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                  </div>
                ) : marketingInsights ? (
                  <>
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-black/5 pb-2">AI Strategy</h3>
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                        <ReactMarkdown>
                          {typeof marketingInsights.strategy === 'object' ? JSON.stringify(marketingInsights.strategy) : String(marketingInsights.strategy || '')}
                        </ReactMarkdown>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-black/5 pb-2">Social Media Posts</h3>
                      <div className="space-y-3">
                        {marketingInsights.socialPosts.map((post, i) => (
                          <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-black/5 text-sm italic text-gray-600">
                            "{typeof post === 'object' ? (post as any).content : String(post)}"
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-black/5 pb-2">Email Marketing Template</h3>
                      <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 prose prose-sm max-w-none text-emerald-900">
                        <ReactMarkdown>
                          {typeof marketingInsights.emailContent === 'object' ? JSON.stringify(marketingInsights.emailContent) : String(marketingInsights.emailContent || '')}
                        </ReactMarkdown>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-black/5 pb-2">Ad Copy Variations</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {marketingInsights.adCopy.map((ad, i) => (
                          <div key={i} className="p-4 bg-white rounded-2xl border border-black/5 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 mb-1">Variation {i + 1}</p>
                            <p className="text-sm text-gray-900">{typeof ad === 'object' ? (ad as any).content : String(ad)}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">No Insights Generated</p>
                      <p className="text-sm text-gray-500">Generate a marketing strategy to see AI recommendations here.</p>
                    </div>
                    <Button onClick={() => {
                      setSelectedProductInsights(null);
                      onGenerateMarketing(selectedProductInsights);
                    }}>
                      Generate Now
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
