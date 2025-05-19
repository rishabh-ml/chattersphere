import mongoose, { Document, Schema } from 'mongoose';

export interface Permission {
  // General permissions
  VIEW_CHANNELS: boolean;
  MANAGE_CHANNELS: boolean;
  MANAGE_ROLES: boolean;
  MANAGE_COMMUNITY: boolean;

  // Member permissions
  KICK_MEMBERS: boolean;
  BAN_MEMBERS: boolean;
  INVITE_MEMBERS: boolean;

  // Message permissions
  SEND_MESSAGES: boolean;
  EMBED_LINKS: boolean;
  ATTACH_FILES: boolean;
  ADD_REACTIONS: boolean;
  MANAGE_MESSAGES: boolean;

  // Voice permissions
  CONNECT: boolean;
  SPEAK: boolean;
  STREAM: boolean;
  MUTE_MEMBERS: boolean;
  DEAFEN_MEMBERS: boolean;
  MOVE_MEMBERS: boolean;
}

export interface IRole extends Document {
  name: string;
  color: string;
  community: mongoose.Types.ObjectId;
  position: number;
  permissions: Permission;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const defaultPermissions: Permission = {
  VIEW_CHANNELS: true,
  MANAGE_CHANNELS: false,
  MANAGE_ROLES: false,
  MANAGE_COMMUNITY: false,

  KICK_MEMBERS: false,
  BAN_MEMBERS: false,
  INVITE_MEMBERS: false,

  SEND_MESSAGES: true,
  EMBED_LINKS: true,
  ATTACH_FILES: true,
  ADD_REACTIONS: true,
  MANAGE_MESSAGES: false,

  CONNECT: true,
  SPEAK: true,
  STREAM: true,
  MUTE_MEMBERS: false,
  DEAFEN_MEMBERS: false,
  MOVE_MEMBERS: false,
};

const PermissionSchema = new Schema<Permission>(
  {
    VIEW_CHANNELS: { type: Boolean, default: true },
    MANAGE_CHANNELS: { type: Boolean, default: false },
    MANAGE_ROLES: { type: Boolean, default: false },
    MANAGE_COMMUNITY: { type: Boolean, default: false },

    KICK_MEMBERS: { type: Boolean, default: false },
    BAN_MEMBERS: { type: Boolean, default: false },
    INVITE_MEMBERS: { type: Boolean, default: false },

    SEND_MESSAGES: { type: Boolean, default: true },
    EMBED_LINKS: { type: Boolean, default: true },
    ATTACH_FILES: { type: Boolean, default: true },
    ADD_REACTIONS: { type: Boolean, default: true },
    MANAGE_MESSAGES: { type: Boolean, default: false },

    CONNECT: { type: Boolean, default: true },
    SPEAK: { type: Boolean, default: true },
    STREAM: { type: Boolean, default: true },
    MUTE_MEMBERS: { type: Boolean, default: false },
    DEAFEN_MEMBERS: { type: Boolean, default: false },
    MOVE_MEMBERS: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    color: { type: String, default: '#99AAB5' },
    community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    position: { type: Number, default: 0 },
    permissions: {
      type: PermissionSchema,
      default: () => defaultPermissions
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create compound index for community and name
RoleSchema.index({ community: 1, name: 1 }, { unique: true });

// Create index for position for sorting
RoleSchema.index({ community: 1, position: 1 });

// Create index for default roles
RoleSchema.index({ community: 1, isDefault: 1 });

// Create index for finding roles with specific permissions
RoleSchema.index({ community: 1, 'permissions.MANAGE_COMMUNITY': 1 });
RoleSchema.index({ community: 1, 'permissions.MANAGE_CHANNELS': 1 });
RoleSchema.index({ community: 1, 'permissions.MANAGE_ROLES': 1 });

// Static method to create default roles for a new community
RoleSchema.statics.createDefaultRoles = async function(communityId: mongoose.Types.ObjectId) {
  const adminPermissions: Permission = {
    ...defaultPermissions,
    MANAGE_CHANNELS: true,
    MANAGE_ROLES: true,
    MANAGE_COMMUNITY: true,
    KICK_MEMBERS: true,
    BAN_MEMBERS: true,
    INVITE_MEMBERS: true,
    MANAGE_MESSAGES: true,
    MUTE_MEMBERS: true,
    DEAFEN_MEMBERS: true,
    MOVE_MEMBERS: true,
  };

  const moderatorPermissions: Permission = {
    ...defaultPermissions,
    KICK_MEMBERS: true,
    INVITE_MEMBERS: true,
    MANAGE_MESSAGES: true,
    MUTE_MEMBERS: true,
  };

  await this.create([
    {
      name: 'Admin',
      color: '#FF0000', // Red
      community: communityId,
      position: 100,
      permissions: adminPermissions,
      isDefault: false,
    },
    {
      name: 'Moderator',
      color: '#00FF00', // Green
      community: communityId,
      position: 50,
      permissions: moderatorPermissions,
      isDefault: false,
    },
    {
      name: 'Member',
      color: '#99AAB5', // Discord default color
      community: communityId,
      position: 0,
      permissions: defaultPermissions,
      isDefault: true,
    },
  ]);
};

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
