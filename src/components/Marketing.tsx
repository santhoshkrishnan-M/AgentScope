import React from 'react';
import { 
  Megaphone, 
  Mail, 
  Share2, 
  Layout, 
  Copy, 
  Check,
  Sparkles,
  ArrowRight,
  Send
} from 'lucide-react';
import { Card, Button } from './ui/Common';
import { MarketingContent, Competitor, Campaign } from '../types';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import ReactMarkdown from 'react-markdown';
import { agentService } from '../services/agentService';

interface MarketingProps {
  user: any;
}

export default function Marketing({ user }: MarketingProps) {
  const [content, setContent] = React.useState<MarketingContent[]>([]);
  const [competitors, setCompetitors] = React.useState<Record<string, Competitor>>({});
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [launching, setLaunching] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'marketingContent'),
      where('userId', '==', user.uid),
      orderBy('generatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContent(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingContent)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'marketingContent');
    });

    const qComp = query(collection(db, 'competitors'), where('userId', '==', user.uid));
    const unsubscribeComp = onSnapshot(qComp, (snapshot) => {
      const compMap: Record<string, Competitor> = {};
      snapshot.docs.forEach(doc => {
        compMap[doc.id] = { id: doc.id, ...doc.data() } as Competitor;
      });
      setCompetitors(compMap);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'competitors');
    });

    const qCamp = query(collection(db, 'campaigns'), where('userId', '==', user.uid), orderBy('sentAt', 'desc'));
    const unsubscribeCamp = onSnapshot(qCamp, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'campaigns');
    });

    return () => {
      unsubscribe();
      unsubscribeComp();
      unsubscribeCamp();
    };
  }, [user]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLaunch = async (item: MarketingContent) => {
    setLaunching(item.id);
    try {
      await agentService.launchCampaign(user.uid, item.id, []);
      alert('Campaign launched successfully to all customers!');
    } catch (err: any) {
      alert(err.message || 'Failed to launch campaign.');
    } finally {
      setLaunching(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Automation</h1>
          <p className="text-gray-500 mt-1">AI-generated marketing strategies and content ready for launch.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2">
            <Send className="w-4 h-4" /> {campaigns.length} Campaigns Sent
          </div>
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate New Content
          </Button>
        </div>
      </div>

      <div className="space-y-12">
        {content.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            No marketing content generated yet.
          </div>
        ) : (
          content.map((item) => (
            <div key={item.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Strategy Response: {competitors[item.competitorId]?.name || 'Market Move'}</h3>
                    <p className="text-sm text-gray-500">Generated on {new Date(item.generatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {campaigns.some(c => c.contentId === item.id) ? (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-sm font-bold">
                    <Check className="w-4 h-4" /> Campaign Launched
                  </div>
                ) : (
                  <Button 
                    variant="secondary" 
                    onClick={() => handleLaunch(item)}
                    isLoading={launching === item.id}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Launch Campaign
                  </Button>
                )}
              </div>

              <Card className="p-8 bg-emerald-50 border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Recommended Strategy
                </h4>
                <div className="prose prose-emerald max-w-none text-emerald-900 font-medium leading-relaxed">
                  <ReactMarkdown>
                    {item.strategy}
                  </ReactMarkdown>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Social Posts */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> Social Media Posts
                  </h4>
                  {(item.socialPosts || []).map((post, i) => (
                    <Card key={i} className="p-4 relative group">
                      <p className="text-sm text-gray-700 leading-relaxed">{post}</p>
                      <button 
                        onClick={() => handleCopy(post, `${item.id}-social-${i}`)}
                        className="absolute top-2 right-2 p-1.5 bg-white border border-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copied === `${item.id}-social-${i}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </Card>
                  ))}
                </div>

                {/* Email Content */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Marketing Email
                  </h4>
                  <Card className="p-6 relative group h-full">
                    <div className="prose prose-sm max-w-none text-sm text-gray-700 whitespace-pre-wrap">
                      <ReactMarkdown>
                        {item.emailContent}
                      </ReactMarkdown>
                    </div>
                    <button 
                      onClick={() => handleCopy(item.emailContent, `${item.id}-email`)}
                      className="absolute top-4 right-4 p-2 bg-white border border-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copied === `${item.id}-email` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </Card>
                </div>

                {/* Ad Copy */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-4 h-4" /> Ad Copy Variations
                  </h4>
                  {(item.adCopy || []).map((ad, i) => (
                    <Card key={i} className="p-4 relative group border-l-4 border-l-black">
                      <p className="text-sm font-bold text-gray-900 mb-1">Variation {i + 1}</p>
                      <p className="text-sm text-gray-600">{ad}</p>
                      <button 
                        onClick={() => handleCopy(ad, `${item.id}-ad-${i}`)}
                        className="absolute top-2 right-2 p-1.5 bg-white border border-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copied === `${item.id}-ad-${i}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="h-px bg-black/5 w-full mt-12" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
