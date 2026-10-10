
import { Client } from '@elastic/elasticsearch'
import { env } from './env'

const node = env.ELASTICSEARCH_URL

if (!node) {
  throw new Error('ELASTICSEARCH_URL is missing from the environment')
}

export const elasticsearch = new Client({ node })

export async function checkElasticsearchConnection(): Promise<void> {
  try {
    const health = await elasticsearch.cluster.health()

    console.log('✅ Elasticsearch connected successfully')
    console.log('Cluster status:', health.status)
  } catch (error) {
    console.error('❌ Could not connect to Elasticsearch:', error)
    throw error
  }
}