import React from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Zap, Shield, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button, Card } from './components/ui/Common';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Competitors from './components/Competitors';
import AIInsights from './components/AIInsights';
import Marketing from './components/Marketing';
import Reports from './components/Reports';
import Customers from './components/Customers';
import Settings from './components/Settings';
import { Competitor, AgentStatus } from './types';
import { agentService } from './services/agentService';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Application Error</h2>
              <p className="text-gray-500">{errorMessage}</p>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload Application
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [agentStatus, setAgentStatus] = React.useState<AgentStatus>('idle');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ensure user exists in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: new Date().toISOString()
          });
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const startWorkflow = async (competitor: Competitor) => {
    if (agentStatus !== 'idle' && agentStatus !== 'completed' && agentStatus !== 'error') return;
    
    setAgentStatus('scouting');
    try {
      // 1. Scout
      const scrapedData = await agentService.scout(competitor);
      
      // 2. Analyst
      setAgentStatus('analyzing');
      const analysis = await agentService.analyze(scrapedData);
      
      // 3. Strategist & Marketing
      setAgentStatus('strategizing');
      const marketing = await agentService.strategizeAndMarket(analysis);
      
      // 4. Report
      setAgentStatus('reporting');
      await agentService.generateReport(user!.uid, competitor.name, marketing);
      
      setAgentStatus('completed');
      setTimeout(() => setAgentStatus('idle'), 5000);
    } catch (error) {
      console.error("Workflow failed:", error);
      setAgentStatus('error');
      setTimeout(() => setAgentStatus('idle'), 5000);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center animate-bounce">
            <Zap className="text-white w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Initializing AgentScope...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Zap className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight">AgentScope</span>
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              Autonomous <span className="text-emerald-600">Market Intelligence</span> for Modern SaaS.
            </h1>
            
            <p className="text-xl text-gray-500 leading-relaxed">
              Let your AI agents monitor competitors, analyze market changes, and launch automated marketing strategies while you sleep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="px-8 h-14 text-lg" onClick={handleLogin}>
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 h-14 text-lg">
                View Demo
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                <Shield className="w-4 h-4" /> Enterprise Grade
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                <Sparkles className="w-4 h-4" /> AI Powered
              </div>
            </div>
          </div>

          <div className="relative">
            <Card className="p-8 bg-black text-white space-y-6 relative z-10 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Live Intelligence Feed</span>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Scout Agent', status: 'Crawl: competitor.com', color: 'text-blue-400' },
                  { label: 'Analyst Agent', status: 'Detected: 15% Price Drop', color: 'text-emerald-400' },
                  { label: 'Strategist Agent', status: 'Generated: Weekend Promo', color: 'text-purple-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className={`text-xs font-mono ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/40 font-mono">
                  $ agentscope run --all-competitors
                  <br />
                  {'>'} Running multi-agent workflow...
                  <br />
                  {'>'} Analysis complete. 3 strategies generated.
                </p>
              </div>
            </Card>
            <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full -z-10" />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} onStartWorkflow={startWorkflow} agentStatus={agentStatus} />;
      case 'competitors':
        return <Competitors user={user} />;
      case 'audience':
        return <Customers user={user} />;
      case 'insights':
        return <AIInsights user={user} />;
      case 'marketing':
        return <Marketing user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'settings':
        return <Settings user={user} />;
      default:
        return <Dashboard user={user} onStartWorkflow={startWorkflow} agentStatus={agentStatus} />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user}>
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
}
