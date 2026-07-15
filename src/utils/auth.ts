export interface AuthSessionPayload {
  uid: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: 'google' | 'email' | 'firebase';
}

export function buildAuthSessionPayload(data: AuthSessionPayload) {
  return {
    uid: data.uid,
    email: data.email,
    name: data.name,
    avatarUrl: data.avatarUrl,
    provider: data.provider,
  };
}
