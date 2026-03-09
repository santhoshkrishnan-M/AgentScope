import { GoogleGenAI } from "@google/genai";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";
import { 
  Competitor, 
  ScrapedData, 
  AnalysisResult, 
  MarketingContent, 
  Report 
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const agentService = {
  /**
   * Scout Agent: Simulates scraping competitor website data.
   */
  async scout(competitor: Competitor): Promise<ScrapedData> {
    const model = "gemini-3.1-flash-lite-preview";
    const prompt = `
      Act as a Scout Agent. Your task is to simulate a website crawl of ${competitor.website} for the company ${competitor.name}.
      Based on the company name and website, provide a realistic JSON object containing:
      - products: A list of 3-5 key products with names and descriptions.
      - pricing: A list of prices for those products.
      - offers: 2-3 current promotions or offers.
      - features: 4-5 key product features.
      
      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{}");
    
    const scrapedData: Omit<ScrapedData, 'id'> = {
      competitorId: competitor.id,
      userId: competitor.userId,
      products: data.products || [],
      pricing: data.pricing || [],
      offers: data.offers || [],
      features: data.features || [],
      scannedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "scrapedData"), scrapedData);
    await updateDoc(doc(db, "competitors", competitor.id), { lastScanAt: scrapedData.scannedAt });
    
    return { id: docRef.id, ...scrapedData };
  },

  /**
   * Analyst Agent: Analyzes competitor data.
   */
  async analyze(scrapedData: ScrapedData): Promise<AnalysisResult> {
    const model = "gemini-3.1-flash-lite-preview";
    const prompt = `
      Act as an Analyst Agent. Analyze the following competitor data:
      Products: ${JSON.stringify(scrapedData.products)}
      Pricing: ${JSON.stringify(scrapedData.pricing)}
      Offers: ${JSON.stringify(scrapedData.offers)}
      Features: ${JSON.stringify(scrapedData.features)}
      
      Provide a JSON analysis:
      - priceChanges: Any detected or likely price changes compared to industry standards.
      - discountPatterns: A summary of their discounting strategy.
      - campaigns: Likely marketing campaigns they are running.
      - positioning: Their market positioning (e.g., luxury, budget, tech-focused).
      
      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{}");

    const analysisResult: Omit<AnalysisResult, 'id'> = {
      competitorId: scrapedData.competitorId,
      userId: scrapedData.userId,
      priceChanges: data.priceChanges || [],
      discountPatterns: data.discountPatterns || "",
      campaigns: data.campaigns || [],
      positioning: data.positioning || "",
      analyzedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "analysisResults"), analysisResult);
    return { id: docRef.id, ...analysisResult };
  },

  /**
   * Strategist Agent: Generates business strategy.
   * Marketing Agent: Prepares marketing content.
   */
  async strategizeAndMarket(analysis: AnalysisResult): Promise<MarketingContent> {
    const model = "gemini-3.1-flash-lite-preview";
    const prompt = `
      Act as a Strategist and Marketing Agent. Based on this competitor analysis:
      ${JSON.stringify(analysis)}
      
      Generate a JSON response:
      - strategy: A comprehensive business strategy to compete.
      - socialPosts: 3 social media post drafts.
      - emailContent: A marketing email template.
      - adCopy: 3 variations of ad copy.
      
      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{}");

    const marketingContent: Omit<MarketingContent, 'id'> = {
      competitorId: analysis.competitorId,
      userId: analysis.userId,
      strategy: data.strategy || "",
      socialPosts: data.socialPosts || [],
      emailContent: data.emailContent || "",
      adCopy: data.adCopy || [],
      generatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "marketingContent"), marketingContent);
    return { id: docRef.id, ...marketingContent };
  },

  /**
   * Report Agent: Generates final structured report.
   */
  async generateReport(userId: string, competitorName: string, marketing: MarketingContent): Promise<Report> {
    const model = "gemini-3.1-flash-lite-preview";
    const prompt = `
      Act as a Report Agent. Create a final business intelligence report for ${competitorName}.
      Strategy: ${marketing.strategy}
      
      Provide a JSON report:
      - title: A professional title for the report.
      - summary: An executive summary.
      - insights: 3-5 key business insights.
      - recommendations: 3-5 actionable recommendations.
      
      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{}");

    const report: Omit<Report, 'id'> = {
      userId,
      title: data.title || `Intelligence Report: ${competitorName}`,
      summary: data.summary || "",
      insights: data.insights || [],
      recommendations: data.recommendations || [],
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "reports"), report);
    return { id: docRef.id, ...report };
  },

  /**
   * Automated Marketing Dispatch: Simulates sending campaigns to customers.
   */
  async launchCampaign(userId: string, contentId: string, targetTags: string[]): Promise<void> {
    // 1. Fetch target customers
    const customersRef = collection(db, "customers");
    const q = query(customersRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    // Filter by tags if provided
    const targetCustomers = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(customer => 
        targetTags.length === 0 || 
        customer.tags?.some((tag: string) => targetTags.includes(tag))
      );

    if (targetCustomers.length === 0) {
      throw new Error("No customers found matching the target criteria.");
    }

    // 2. Simulate sending (e.g., email dispatch)
    console.log(`Dispatching campaign ${contentId} to ${targetCustomers.length} customers...`);
    
    // 3. Record campaign
    await addDoc(collection(db, "campaigns"), {
      userId,
      contentId,
      targetTags,
      status: 'sent',
      sentAt: new Date().toISOString()
    });
  }
};
