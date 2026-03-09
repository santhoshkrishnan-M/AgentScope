import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Globe, 
  Trash2, 
  Pause, 
  Play,
  AlertCircle
} from 'lucide-react';
import { Card, Button } from './ui/Common';
import { Competitor } from '../types';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface CompetitorsProps {
  user: any;
}

export default function Competitors({ user }: CompetitorsProps) {
  const [competitors, setCompetitors] = React.useState<Competitor[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newComp, setNewComp] = React.useState({ name: '', website: '' });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'competitors'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCompetitors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Competitor)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'competitors');
    });

    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComp.name || !newComp.website) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Basic URL validation
      const url = newComp.website.startsWith('http') ? newComp.website : `https://${newComp.website}`;
      
      await addDoc(collection(db, 'competitors'), {
        userId: user.uid,
        name: newComp.name,
        website: url,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      
      setNewComp({ name: '', website: '' });
      setIsAdding(false);
    } catch (err) {
      setError('Failed to add competitor. Please check the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this competitor?')) {
      await deleteDoc(doc(db, 'competitors', id));
    }
  };

  const toggleStatus = async (comp: Competitor) => {
    const newStatus = comp.status === 'active' ? 'paused' : 'active';
    await updateDoc(doc(db, 'competitors', comp.id), { status: newStatus });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitors</h1>
          <p className="text-gray-500 mt-1">Manage the companies you want to monitor.</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Competitor
        </Button>
      </div>

      {isAdding && (
        <Card className="p-8 border-2 border-black/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Add New Competitor</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
              <Plus className="w-5 h-5 rotate-45" />
            </Button>
          </div>
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Company Name</label>
                <input 
                  type="text" 
                  required
                  value={newComp.name}
                  onChange={e => setNewComp(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-black/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Website URL</label>
                <input 
                  type="text" 
                  required
                  value={newComp.website}
                  onChange={e => setNewComp(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="e.g. acme.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-black/10 outline-none transition-all"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" isLoading={isLoading}>Add to Monitoring</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitors.length === 0 && !isAdding ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Globe className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium">No competitors added yet.</p>
            <Button variant="outline" onClick={() => setIsAdding(true)}>Add your first competitor</Button>
          </div>
        ) : (
          competitors.map((comp) => (
            <Card key={comp.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl font-bold">
                    {comp.name[0]}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleStatus(comp)}>
                      {comp.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(comp.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-lg font-bold">{comp.name}</h3>
                <a href={comp.website} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline flex items-center mt-1">
                  {new URL(comp.website).hostname}
                </a>
                
                <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Status</span>
                    <span className={`text-xs font-bold mt-1 ${comp.status === 'active' ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {comp.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Last Scan</span>
                    <span className="text-xs font-bold mt-1">
                      {comp.lastScanAt ? new Date(comp.lastScanAt).toLocaleDateString() : 'NEVER'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
