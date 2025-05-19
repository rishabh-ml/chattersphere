import mongoose, { Document, Schema } from 'mongoose';

export interface PageView {
  path: string;
  timestamp: Date;
  duration: number;
  referrer?: string;
  userAgent?: string;
}

export interface IAnalytics extends Document {
  user: mongoose.Types.ObjectId;
  pageViews: PageView[];
  totalVisits: number;
  lastVisit: Date;
  avgSessionDuration: number;
  mostVisitedPages: { path: string; count: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const PageViewSchema = new Schema<PageView>(
  {
    path: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
    referrer: { type: String },
    userAgent: { type: String },
  },
  { _id: false }
);

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    pageViews: [PageViewSchema],
    totalVisits: { type: Number, default: 0 },
    lastVisit: { type: Date, default: Date.now },
    avgSessionDuration: { type: Number, default: 0 },
    mostVisitedPages: [
      {
        path: { type: String, required: true },
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// Create index for user
AnalyticsSchema.index({ user: 1 }, { unique: true });

// Create index for lastVisit
AnalyticsSchema.index({ lastVisit: -1 });

// Method to add a page view
AnalyticsSchema.methods.addPageView = function(pageView: PageView) {
  this.pageViews.push(pageView);
  this.totalVisits += 1;
  this.lastVisit = new Date();
  
  // Update most visited pages
  const existingPage = this.mostVisitedPages.find(p => p.path === pageView.path);
  if (existingPage) {
    existingPage.count += 1;
  } else {
    this.mostVisitedPages.push({ path: pageView.path, count: 1 });
  }
  
  // Sort most visited pages by count in descending order
  this.mostVisitedPages.sort((a, b) => b.count - a.count);
  
  // Keep only top 10 most visited pages
  if (this.mostVisitedPages.length > 10) {
    this.mostVisitedPages = this.mostVisitedPages.slice(0, 10);
  }
  
  // Calculate average session duration
  const totalDuration = this.pageViews.reduce((sum, view) => sum + view.duration, 0);
  this.avgSessionDuration = totalDuration / this.pageViews.length;
  
  return this.save();
};

export default mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
