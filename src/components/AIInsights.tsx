import React from 'react';
import { 
  Zap, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Card, Button } from './ui/Common';
import { AnalysisResult, Competitor } from '../types';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface AIInsightsProps {
  user: any;
}

export default function AIInsights({ user }: AIInsightsProps) {
  const [insights, setInsights] = React.useState<AnalysisResult[]>([]);
  const [competitors, setCompetitors] = React.useState<Record<string, Competitor>>({});

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'analysisResults'),
      where('userId', '==', user.uid),
      orderBy('analyzedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInsights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisResult)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'analysisResults');
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

    return () => {
      unsubscribe();
      unsubscribeComp();
    };
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-gray-500 mt-1">Deep analysis of market changes and competitor moves.</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {insights.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500">
            No insights generated yet. Run an analysis from the dashboard.
          </div>
        ) : (
          insights.map((insight) => (
            <Card key={insight.id} className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">{competitors[insight.competitorId]?.name || 'Unknown Competitor'}</h3>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      Analyzed on {new Date(insight.analyzedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Price Changes</span>
                  </div>
                  <ul className="space-y-1">
                    {Array.isArray(insight.priceChanges) ? insight.priceChanges.map((change: any, i: number) => (
                      <li key={i} className="text-sm font-medium text-gray-700 flex items-center justify-between">
                        <span>{change.product || 'Product'}</span>
                        <span className="text-emerald-600">{change.change || 'N/A'}</span>
                      </li>
                    )) : (
                      <li className="text-sm text-gray-500 italic">No price changes detected</li>
                    )}
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Positioning</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed">
                    {typeof insight.positioning === 'object' ? JSON.stringify(insight.positioning) : String(insight.positioning || '')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Campaigns Detected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(insight.campaigns) ? insight.campaigns.map((campaign, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">
                      {typeof campaign === 'object' && campaign !== null 
                        ? (campaign as any).content || (campaign as any).name || JSON.stringify(campaign)
                        : String(campaign)}
                    </span>
                  )) : (
                    <span className="text-xs text-gray-400 italic">No campaigns detected</span>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-black/5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Discount Patterns</h4>
                <p className="text-sm text-gray-600 leading-relaxed italic">
                  "{typeof insight.discountPatterns === 'object' ? JSON.stringify(insight.discountPatterns) : String(insight.discountPatterns || '')}"
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
