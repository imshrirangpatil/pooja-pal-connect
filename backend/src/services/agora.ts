import crypto from 'crypto';

/**
 * Agora RTC token generation — STUB.
 * Real implementation should use agora-access-token (RtcTokenBuilder) with the
 * App ID + App Certificate. Returns a placeholder token in dev.
 */
export function buildRtcToken(channelName: string, uid: string): { token: string; channelName: string; uid: string; expiresIn: number } {
  const token = `agora_stub_${crypto.createHash('sha1').update(`${channelName}:${uid}`).digest('hex').slice(0, 24)}`;
  // TODO(video): RtcTokenBuilder.buildTokenWithUid(appId, appCert, channelName, uid, role, expireTs)
  return { token, channelName, uid, expiresIn: 3600 };
}
