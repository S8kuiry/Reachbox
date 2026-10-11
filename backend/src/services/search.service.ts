
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
  query: string,
  field: 'all' | 'recipient' | 'sender' | 'subject' | 'body' = 'all',
  status: 'all' | 'scheduled' | 'processing' | 'sent' | 'failed' = 'all'
) {
  // Build dynamic must/should clauses based on the selected field filter
  const escapeWildcard = (s: string) => s.replace(/[*?\\]/g, '\\$&')
  const q = escapeWildcard(query)

  const wildcard = (f: string) => ({
    wildcard: { [f]: { value: `*${q}*`, case_insensitive: true } },
  })

  let mustQuery: any[]

  if (!query) {
    mustQuery = [{ match_all: {} }]
  } else if (field === 'recipient') {
    mustQuery = [wildcard('recipients')]
  } else if (field === 'sender') {
    mustQuery = [wildcard('sender')]
  } else if (field === 'subject') {
    mustQuery = [{ match: { subject: { query, fuzziness: 'AUTO', boost: 3 } } }]
  } else if (field === 'body') {
    mustQuery = [{ match: { body: { query, fuzziness: 'AUTO' } } }]
  } else {
    mustQuery = [
      {
        bool: {
          should: [
            wildcard('recipients'),
            wildcard('sender'),
            { match: { subject: { query, fuzziness: 'AUTO', boost: 3 } } },
            { match: { body: { query, fuzziness: 'AUTO' } } },
          ],
          minimum_should_match: 1,
        },
      },
    ]
  }

  // Build filter array (ownerId isolation + optional status filter)
  const filters: any[] = [
    {
      term: { ownerId: userId },
    },
  ]

  if (status !== 'all') {
    filters.push({
      term: { status: status.toUpperCase() }, // Matches PostgreSQL uppercase status
    })
  }
  // console.log('ES search:', { userId, query, field, status })
  const result = await elasticsearch.search({
    index: EMAIL_INDEX,
    from: 0,
    size: 50,
    query: {
      bool: {
        filter: filters,
        must: mustQuery,
      },
    },
    sort: [{ scheduledAt: { order: 'desc' } }],
  })

  return result.hits.hits.map((hit) => hit._source)
}

//delete emails 
export async function deleteIndexedEmail(emailId: string): Promise<void> {
  try {
    await elasticsearch.delete({
      index: EMAIL_INDEX,
      id: emailId,
    })
  } catch (error: any) {
    if (error.meta?.statusCode !== 404) {
      console.error(`Failed to delete email ${emailId} from Elasticsearch:`, error)
    }
  }
}