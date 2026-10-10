
import { elasticsearch } from '../config/elasticsearch'
import { db } from '../db'

const EMAIL_INDEX = 'emails'




export async function initElasticsearch(): Promise<void> {
  const exists = await elasticsearch.indices.exists({
    index: EMAIL_INDEX,
  })

  if (exists) {
    console.log(`ℹ️ Elasticsearch index "${EMAIL_INDEX}" already exists`)
    return
  }

  await elasticsearch.indices.create({
    index: EMAIL_INDEX,
    mappings: {
      properties: {
        id: { type: 'keyword' },
        ownerId: { type: 'keyword' },
        sender: { type: 'keyword' },
        recipients: { type: 'keyword' },
        subject: { type: 'text' },
        body: { type: 'text' },
        status: { type: 'keyword' },
        scheduledAt: { type: 'date' },
        sentAt: { type: 'date' },
      },
    },
  })

  console.log(`✅ Elasticsearch index "${EMAIL_INDEX}" created`)
}

export interface SearchableEmail {
  id: string
  ownerId: string
  sender: string
  recipients: string[]
  subject: string
  body: string
  status: string
  scheduledAt: Date | string
  sentAt: Date | string | null
}

export async function indexEmail(email: SearchableEmail): Promise<void> {
  await elasticsearch.index({
    index: EMAIL_INDEX,
    id: email.id,
    document: {
      id: email.id,
      ownerId: email.ownerId,
      sender: email.sender,
      recipients: email.recipients,
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduledAt: email.scheduledAt,
      sentAt: email.sentAt,
    },
    refresh: 'wait_for',
  })
}


export async function indexExistingEmails(): Promise<void> {
  const batchSize = 500
  let cursor: string | undefined
  let indexedCount = 0

  while (true) {
    const emails = await db.email.findMany({
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    })

    if (emails.length === 0) break

    const operations = emails.flatMap((email) => [
      { index: { _index: EMAIL_INDEX, _id: email.id } },
      {
        id: email.id,
        ownerId: email.ownerId,
        sender: email.sender,
        recipients: email.recipients,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledAt: email.scheduledAt,
        sentAt: email.sentAt,
      },
    ])

    const result = await elasticsearch.bulk({
      operations,
      refresh: false,
    })

    if (result.errors) {
      const failures = result.items.filter((item) => item.index?.error)
      console.error('Some emails could not be indexed:', failures.slice(0, 5))
      throw new Error(`Failed to index ${failures.length} emails`)
    }

    indexedCount += emails.length
    cursor = emails[emails.length - 1].id
  }

  await elasticsearch.indices.refresh({ index: EMAIL_INDEX })
  console.log(`✅ Indexed ${indexedCount} existing emails`)
}



export async function updateIndexedEmail(
  emailId: string,
  updates: {
    status: string
    sentAt?: Date | string | null
  }
): Promise<void> {
  await elasticsearch.update({
    index: EMAIL_INDEX,
    id: emailId,
    doc: {
      status: updates.status,
      ...(updates.sentAt !== undefined && {
        sentAt: updates.sentAt,
      }),
    },
    retry_on_conflict: 3,
  })
}




export async function searchEmails(
  userId: string,
  query: string
) {
  const result = await elasticsearch.search({
    index: EMAIL_INDEX,
    from: 0,
    size: 50,
    query: {
      bool: {
        filter: [
          {
            term: {
              ownerId: userId,
            },
          },
        ],
        must: [
          {
            multi_match: {
              query: query,
              fields: [
                'sender',
                'recipients',
                'subject^3',
                'body',
              ],
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        ],
      },
    },
    sort: [
      { scheduledAt: { order: 'desc' } },
    ],
  })

  return result.hits.hits.map((hit) => hit._source)
}