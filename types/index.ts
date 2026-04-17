// Type definitions for the application

export interface User {
  userId: string;
  email: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
}

export interface Meeting {
  _id: string;
  meetingId: string;
  hostId: string;
  hostEmail: string;
  title: string;
  description: string;
  isPrivate: boolean;
  chatEnabled: boolean;
  recordingEnabled: boolean;
  joinCount: number;
  lastSessionAt?: Date | null;
  lastRecordingAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMeetingRequest {
  hostEmail: string;
  title: string;
  description?: string;
  isPrivate?: boolean;
  chatEnabled?: boolean;
  recordingEnabled?: boolean;
}

export interface CreateMeetingResponse {
  success: boolean;
  meetingId: string;
  meeting: Meeting;
}

export interface GetMeetingResponse {
  success: boolean;
  meeting: Meeting;
}

export interface GetMeetingsResponse {
  success: boolean;
  meetings: Meeting[];
}

export interface ApiError {
  error: string;
  status: number;
}

export interface JitsiMeetExternalAPIOptions {
  roomName: string;
  parentNode: HTMLElement;
  width: string | number;
  height: string | number;
  userInfo?: {
    email?: string;
    displayName?: string;
  };
  configOverwrite?: Record<string, any>;
  interfaceConfigOverwrite?: Record<string, any>;
}
