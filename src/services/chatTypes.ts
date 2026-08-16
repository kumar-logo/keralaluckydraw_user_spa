export enum MessageKind {
  Text = 'text',
  Image = 'image',
  Voice = 'voice',
}

export enum TickState {
  Pending = 'pending',
  Sent = 'sent',
  Delivered = 'delivered',
  Seen = 'seen',
}

export enum RecState {
  Idle = 'idle',
  Requesting = 'requesting',
  Recording = 'recording',
  Encoding = 'encoding',
  Uploading = 'uploading',
  Error = 'error',
}

export enum JoinPolicy {
  Open = 'open',
  Invite = 'invite',
}

export enum PostPolicy {
  All = 'all',
  AdminOnly = 'admin_only',
}

export enum GroupType {
  Public = 'public',
  Private = 'private',
}

export enum SenderRole {
  User = 'user',
  Admin = 'admin',
}
