import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'comment'
  | 'reply'
  | 'follow'
  | 'mention'
  | 'post_like'
  | 'comment_like'
  | 'community_invite'
  | 'community_join'
  | 'membership_request'
  | 'membership_approved'
  | 'membership_rejected';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  read: boolean;
  relatedPost?: mongoose.Types.ObjectId;
  relatedComment?: mongoose.Types.ObjectId;
  relatedCommunity?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      required: true,
      enum: [
        'comment',
        'reply',
        'follow',
        'mention',
        'post_like',
        'comment_like',
        'community_invite',
        'community_join',
        'membership_request',
        'membership_approved',
        'membership_rejected'
      ]
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedPost: { type: Schema.Types.ObjectId, ref: 'Post' },
    relatedComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    relatedCommunity: { type: Schema.Types.ObjectId, ref: 'Community' },
  },
  { timestamps: true }
);

// Create indexes for faster queries
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
