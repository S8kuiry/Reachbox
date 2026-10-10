import { Client } from '@elastic/elasticsearch'
import { env } from '../config/env'

export const esClient = new Client({
  node: env.ELASTICSEARCH_URL,
})

const INDEX_NAME = 'emails'

/**
 * Ensures 'emails' index exists in Elasticsearch on boot.
 */
export async function initElasticsearch() {
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME })
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            senderEmail: { type: 'keyword' },
            recipient: { type: 'keyword' },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
          },
        },
      })
      console.log('✅ Created Elasticsearch "emails" index')
    }
  } catch (err) {
    console.error('⚠️ Elasticsearch init warning:', err)
  }
}

/**
 * Indexes an email into Elasticsearch for instant searchability.
 */
export async function indexEmail(emailData: Record<string, any>) {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: emailData.id,
      document: emailData,
    })
  } catch (err) {
    console.error(`❌ Elasticsearch indexing failed for email ${emailData.id}:`, err)
  }
}

/**
 * Full-text search on emails by query string for a specific user.
 */
export async function searchEmails(userId: string, query: string) {
  try {
    const response = await esClient.search({
      index: INDEX_NAME,
      query: {
        bool: {
          must: [
            { match: { userId } },
            {
              multi_match: {
                query,
                fields: ['subject', 'body', 'recipient', 'senderEmail'],
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      },
    })

    return response.hits.hits.map((hit) => hit._source)
  } catch (err) {
    console.error('❌ Elasticsearch search failed:', err)
    return []
  }
}