import mongoose, { Schema, Document } from "mongoose";

export interface IResume extends Document {
  userId: string;
  tenantId: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  resumePath: string;
  imagePath: string;
  feedback: {
    overallScore: number;
    ATS: any;
    toneAndStyle: any;
    content: any;
    structure: any;
    skills: any;
  };
  tokensUsed: number;
  processingCost: number;
  processingTime: number;
  createdAt: Date;
}

const ResumeSchema = new Schema(
  {
    userId: { type: String, index: true },
    tenantId: { type: String, index: true },
    companyName: String,
    jobTitle: String,
    jobDescription: String,
    resumePath: String,
    imagePath: String,
    feedback: {
      overallScore: Number,
      ATS: Schema.Types.Mixed, // Uppercase
      toneAndStyle: Schema.Types.Mixed,
      content: Schema.Types.Mixed,
      structure: Schema.Types.Mixed,
      skills: Schema.Types.Mixed,
    },
    tokensUsed: Number,
    processingCost: Number,
    processingTime: Number,
  },
  { timestamps: true }
);

ResumeSchema.index({ tenantId: 1, createdAt: -1 });
ResumeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IResume>("Resume", ResumeSchema);
