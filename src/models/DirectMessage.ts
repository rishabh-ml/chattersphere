import mongoose, { Document, Schema } from "mongoose";

export interface Attachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface IDirectMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  attachments: Attachment[];
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema({
  url: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: Number, required: true },
});

const DirectMessageSchema = new Schema<IDirectMessage>(
  {
    content: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    attachments: [AttachmentSchema],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create compound index for efficient conversation queries
DirectMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
DirectMessageSchema.index({ recipient: 1, isRead: 1 });

// Create model only if it doesn't exist already
const DirectMessage =
  mongoose.models.DirectMessage ||
  mongoose.model<IDirectMessage>("DirectMessage", DirectMessageSchema);

export default DirectMessage;
