import type { EmailJob, User } from '../types'

const hour = 60 * 60 * 1000
const minute = 60 * 1000
const now = Date.now()
const iso = (offset: number) => new Date(now + offset).toISOString()

export const mockUser: User = {
  id: 'u1',
  name: 'Subharthy Kuiry',
  email: 'subharthy@example.com',
  avatarUrl: '',
  hourlyLimit: 200,
  createdAt: iso(0),
  updatedAt: iso(0),
}

// 6 scheduled · 2 sent · 1 failed → 66.7% delivery rate (matches the design)
export const mockEmails: EmailJob[] = [
  { id: '1', to: 'olivia@acme.com', subject: 'A better way to connect with your customers', body: 'Hi Olivia, I wanted to share something with your team that could help…', status: 'scheduled', scheduledAt: iso(2 * hour), sentAt: null },
  { id: '2', to: 'phoenix@layers.design', subject: 'Quick question about your outreach', body: 'Hi Phoenix, how is your team handling outreach these days?', status: 'scheduled', scheduledAt: iso(2 * hour + 5 * minute), sentAt: null },
  { id: '3', to: 'lana.steiner@ideacon.com', subject: 'Following up on our conversation', body: 'Hi Lana, it was great connecting last week.', status: 'scheduled', scheduledAt: iso(2 * hour + 10 * minute), sentAt: null },
  { id: '4', to: 'demi.moore@northwind.io', subject: 'Something your team might find useful', body: 'Hi Demi, here is the overview we discussed.', status: 'scheduled', scheduledAt: iso(2 * hour + 15 * minute), sentAt: null },
  { id: '5', to: 'drew.feist@stellar.app', subject: "Let's find a time to chat", body: 'Hi Drew, would you have time for a quick call tomorrow?', status: 'scheduled', scheduledAt: iso(27 * hour), sentAt: null },
  { id: '6', to: 'sara.ortiz@brightlabs.co', subject: 'Ideas for your next campaign', body: 'Hi Sara, a couple of ideas came to mind after your launch…', status: 'scheduled', scheduledAt: iso(30 * hour), sentAt: null },
  { id: '7', to: 'dave@umbrella.com', subject: 'Partnership opportunity', body: 'Hi Dave, we loved what your team shipped last month.', status: 'sent', scheduledAt: iso(-5 * hour), sentAt: iso(-5 * hour) },
  { id: '8', to: 'erin@hooli.com', subject: 'Partnership opportunity', body: 'Hi Erin, quick note from the team at ReachInbox.', status: 'sent', scheduledAt: iso(-4 * hour), sentAt: iso(-4 * hour) },
  { id: '9', to: 'frank@piedpiper.com', subject: 'Demo invite', body: 'Hi Frank, want a 15-minute walkthrough this week?', status: 'failed', scheduledAt: iso(-3 * hour), sentAt: iso(-3 * hour) },
]