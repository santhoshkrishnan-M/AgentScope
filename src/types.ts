export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
}

export interface Competitor {
  id: string;
  userId: string;
  name: string;
  website: string;
  status: 'active' | 'paused' | 'archived';
  lastScanAt?: string;
  createdAt: string;
}

export interface ScrapedData {
  id: string;
  competitorId: string;
  userId: string;
  products: any[];
  pricing: any[];
  offers: string[];
  features: string[];
  scannedAt: string;
}

export interface AnalysisResult {
  id: string;
  competitorId: string;
  userId: string;
  priceChanges: any[];
  discountPatterns: string;
  campaigns: string[];
  positioning: string;
  analyzedAt: string;
}

export interface MarketingContent {
  id: string;
  competitorId: string;
  userId: string;
  strategy: string;
  socialPosts: string[];
  emailContent: string;
  adCopy: string[];
  generatedAt: string;
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  tags: string[];
  createdAt: string;
}

export interface Campaign {
  id: string;
  userId: string;
  contentId: string;
  targetTags: string[];
  status: 'sent' | 'failed';
  sentAt: string;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  discountPrice?: number;
  features: string[];
  imageUrl?: string;
  websiteUrl?: string;
  targetMarket?: string;
  marketingGoal: string;
  campaignBudget?: number;
  campaignDuration?: string;
  marketingChannels: string[];
  campaignStatus: 'draft' | 'active' | 'completed';
  lastMarketingAction?: string;
  createdAt: string;
}

export type AgentStatus = 'idle' | 'scouting' | 'analyzing' | 'strategizing' | 'marketing' | 'reporting' | 'completed' | 'error';
