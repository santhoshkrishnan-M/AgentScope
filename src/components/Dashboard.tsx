import React from 'react';
import { 
  Users, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  ExternalLink,
  Play
} from 'lucide-react';
import { Card, Button } from './ui/Common';
import { Competitor, AgentStatus } from '../types';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface DashboardProps {
  user: any;
  onStartWorkflow: (competitor: Competitor) => void;
  agentStatus: AgentStatus;
}

export default function Dashboard({ user, onStartWorkflow, agentStatus }: DashboardProps) {
  const [competitors, setCompetitors] = React.useState<Competitor[]>([]);
  const [stats, setStats] = React.useState({
    monitored: 0,
    changes: 0,
    products: 0,
    recommendations: 0
  });

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'competitors'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Competitor));
      setCompetitors(comps);
      setStats(prev => ({ ...prev, monitored: comps.length }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'competitors');
    });

    return () => unsubscribe();
  }, [user]);

  const workflowSteps = [
    { id: 'scouting', label: 'Scout', color: 'bg-blue-500' },
    { id: 'analyzing', label: 'Analyst', color: 'bg-purple-500' },
    { id: 'strategizing', label: 'Strategist', color: 'bg-emerald-500' },
    { id: 'marketing', label: 'Marketing', color: 'bg-orange-500' },
    { id: 'reporting', label: 'Report', color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back. Here's what's happening with your competitors.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            Last 24 Hours
          </Button>
          <Button>
            <Play className="w-4 h-4 mr-2" />
            Run All Agents
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Competitors Monitored', value: stats.monitored, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Price Changes', value: '12', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'New Products', value: '5', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'AI Recommendations', value: '28', icon: CheckCircle2, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </Card>
        ))}
      </div>

      {/* Agent Workflow Visualization */}
      <Card className="p-8 bg-black text-white overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-6">Agent Workflow Status</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {workflowSteps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                    agentStatus === step.id ? 'scale-125 ring-4 ring-white/20' : 'opacity-50'
                  } ${step.color}`}>
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${
                    agentStatus === step.id ? 'text-white' : 'text-white/40'
                  }`}>{step.label}</span>
                </div>
                {i < workflowSteps.length - 1 && (
                  <div className="hidden md:block flex-1 h-px bg-white/10 relative">
                    {agentStatus === step.id && (
                      <div className="absolute inset-0 bg-white/40 animate-pulse" />
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Competitor Table */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-bold">Recent Competitor Activity</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Competitor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Scan</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {competitors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No competitors added yet.
                    </td>
                  </tr>
                ) : (
                  competitors.map((comp) => (
                    <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                            {comp.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{comp.name}</p>
                            <a href={comp.website} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center hover:underline">
                              {new URL(comp.website).hostname}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          comp.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {comp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {comp.lastScanAt ? new Date(comp.lastScanAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onStartWorkflow(comp)}
                          isLoading={agentStatus !== 'idle' && agentStatus !== 'completed' && agentStatus !== 'error'}
                        >
                          Run Analysis
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Insights Panel */}
        <Card className="flex flex-col">
          <div className="p-6 border-b border-black/5">
            <h3 className="font-bold">Latest AI Insights</h3>
          </div>
          <div className="p-6 flex-1 space-y-6">
            {[
              { title: 'Price Alert', desc: 'Competitor A dropped prices on flagship earbuds by 15%.', time: '2h ago', type: 'price' },
              { title: 'New Launch', desc: 'Competitor B added a new "Pro" tier to their software.', time: '5h ago', type: 'launch' },
              { title: 'Campaign Detected', desc: 'Summer Sale campaign spotted on Competitor C homepage.', time: '1d ago', type: 'campaign' },
            ].map((insight, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                  insight.type === 'price' ? 'bg-red-50 text-red-600' : 
                  insight.type === 'launch' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold">{insight.title}</h4>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">{insight.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{insight.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-black/5">
            <Button variant="ghost" className="w-full text-sm">View All Insights <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
