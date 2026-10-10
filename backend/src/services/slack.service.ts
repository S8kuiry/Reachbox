import { WebClient } from '@slack/web-api'
import { env } from '../config/env'

/**
 * Exchanges OAuth temporary code for a permanent access token & channel ID.
 */
export async function exchangeSlackCode(code: string) {
  if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET || !env.SLACK_REDIRECT_URI) {
    throw new Error('Slack OAuth credentials are missing in env vars')
  }

  const client = new WebClient()
  const response = await client.oauth.v2.access({
    client_id: env.SLACK_CLIENT_ID,
    client_secret: env.SLACK_CLIENT_SECRET,
    code,
    redirect_uri: env.SLACK_REDIRECT_URI,
  })

  if (!response.ok || !response.access_token) {
    throw new Error(`Slack OAuth failed: ${response.error}`)
  }

  return {
    accessToken: response.access_token,
    channelId: response.incoming_webhook?.channel_id || response.authed_user?.id || '',
  }
}

/**
 * Sends a real-time message to Slack when hourly rate limit is reached.
 */
export async function notifySlackRateLimitHit(
  slackAccessToken: string,
  channelId: string,
  senderEmail: string,
  currentCount: number,
  limit: number
) {
  try {
    const slack = new WebClient(slackAccessToken)
    await slack.chat.postMessage({
      channel: channelId,
      text: `🚨 *Hourly Email Rate Limit Alert*\nSender \`${senderEmail}\` reached hourly threshold: *${currentCount}/${limit}* emails. Further jobs will be delayed to the next hour window.`,
    })
    console.log(`📢 Slack alert sent for sender: ${senderEmail}`)
  } catch (err) {
    console.error('❌ Failed to send Slack alert:', err)
  }
}