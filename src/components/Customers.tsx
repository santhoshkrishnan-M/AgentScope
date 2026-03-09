import React from 'react';
import { 
  Plus, 
  Users, 
  Mail, 
  Tag, 
  Trash2, 
  Search,
  Filter,
  UserPlus
} from 'lucide-react';
import { Card, Button } from './ui/Common';
import { Customer } from '../types';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface CustomersProps {
  user: any;
}

export default function Customers({ user }: CustomersProps) {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newCust, setNewCust] = React.useState({ name: '', email: '', tags: '' });
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'customers'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });

    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.email) return;
    
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'customers'), {
        userId: user.uid,
        name: newCust.name,
        email: newCust.email,
        tags: newCust.tags.split(',').map(t => t.trim()).filter(t => t),
        createdAt: new Date().toISOString()
      });
      setNewCust({ name: '', email: '', tags: '' });
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this customer?')) {
      await deleteDoc(doc(db, 'customers', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Target Audience</h1>
          <p className="text-gray-500 mt-1">Manage your customers and target segments.</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {isAdding && (
        <Card className="p-8 border-2 border-black/10">
          <h3 className="text-xl font-bold mb-6">Add New Customer</h3>
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Name</label>
                <input 
                  type="text" 
                  required
                  value={newCust.name}
                  onChange={e => setNewCust(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Email</label>
                <input 
                  type="email" 
                  required
                  value={newCust.email}
                  onChange={e => setNewCust(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={newCust.tags}
                  onChange={e => setNewCust(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl outline-none"
                  placeholder="premium, early-adopter"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" isLoading={isLoading}>Save Customer</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((cust) => (
          <Card key={cust.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                {cust.name[0]}
              </div>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(cust.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <h3 className="text-lg font-bold">{cust.name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <Mail className="w-3 h-3" /> {cust.email}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {cust.tags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
