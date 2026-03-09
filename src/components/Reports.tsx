import React from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  ChevronRight,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { Card, Button } from './ui/Common';
import { Report } from '../types';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ReportsProps {
  user: any;
}

export default function Reports({ user }: ReportsProps) {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reports'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    return () => unsubscribe();
  }, [user]);

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!selectedReport) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedReport.title,
          text: selectedReport.summary,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (selectedReport) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedReport(null)}>
            <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
            Back to Reports
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleShare}>Share Report</Button>
          </div>
        </div>

        <Card className="p-12 max-w-4xl mx-auto space-y-12 bg-white shadow-2xl">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{selectedReport.title}</h1>
            <div className="flex items-center justify-center gap-4 text-gray-500 font-medium">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(selectedReport.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>AgentScope Intelligence</span>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-black/5 pb-4">Executive Summary</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              {typeof selectedReport.summary === 'object' ? JSON.stringify(selectedReport.summary) : String(selectedReport.summary || '')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-orange-500" /> Key Insights
              </h3>
              <ul className="space-y-4">
                {(selectedReport.insights || []).map((insight, i) => (
                  <li key={i} className="flex gap-3 text-gray-600 leading-relaxed">
                    <span className="font-bold text-black">{i + 1}.</span>
                    {typeof insight === 'object' && insight !== null 
                      ? (insight as any).content || (insight as any).text || JSON.stringify(insight)
                      : String(insight)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Recommendations
              </h3>
              <ul className="space-y-4">
                {(selectedReport.recommendations || []).map((rec, i) => (
                  <li key={i} className="flex gap-3 p-4 bg-emerald-50 rounded-2xl text-emerald-900 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    {typeof rec === 'object' && rec !== null 
                      ? (rec as any).content || (rec as any).text || JSON.stringify(rec)
                      : String(rec)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-black/5 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">End of Report • Generated by AgentScope AI</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Intelligence Reports</h1>
        <p className="text-gray-500 mt-1">Comprehensive business intelligence reports generated by your agents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500">
            No reports generated yet.
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="group hover:shadow-xl transition-all duration-300">
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{report.title}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                  {typeof report.summary === 'object' ? JSON.stringify(report.summary) : String(report.summary || '')}
                </p>
                <div className="pt-4 flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Report
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
