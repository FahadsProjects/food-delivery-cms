import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { ConfigItem, ConfigByScreen } from '../types/content.js';

const client = new DynamoDBClient({});

function getTableName(): string {
  const name = process.env.CONTENT_TABLE_NAME;
  if (!name) {
    throw new Error('CONTENT_TABLE_NAME environment variable is required');
  }
  return name;
}

function getEnvironment(): string {
  return process.env.ENVIRONMENT ?? 'production';
}

/**
 * Fetch published config for an app, grouped by screen
 */
export async function getConfig(app: string): Promise<ConfigByScreen> {
  const tableName = getTableName();
  const env = getEnvironment();
  const pk = `APP#${app}`;
  const skPrefix = `ENV#${env}`;

  const result = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      FilterExpression: '#status = :published',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: marshall({
        ':pk': pk,
        ':skPrefix': skPrefix,
        ':published': 'published',
      }),
    })
  );

  const items = (result.Items ?? []).map((item) => unmarshall(item) as ConfigItem);
  return transformToConfigByScreen(items);
}

function transformToConfigByScreen(items: ConfigItem[]): ConfigByScreen {
  const byScreen: ConfigByScreen = {};

  for (const item of items) {
    if (!item.screen || !item.key) continue;

    if (!byScreen[item.screen]) {
      byScreen[item.screen] = {};
    }

    let parsedValue: unknown = item.value;
    if (item.type === 'json') {
      try {
        parsedValue = JSON.parse(item.value);
      } catch {
        parsedValue = item.value;
      }
    }

    byScreen[item.screen][item.key] = parsedValue;
  }

  return byScreen;
}

/**
 * Create or overwrite a config item
 */
export async function putConfig(
  app: string,
  screen: string,
  key: string,
  value: string,
  type: string,
  updatedBy: string
): Promise<void> {
  const tableName = getTableName();
  const env = getEnvironment();
  const now = new Date().toISOString();

  const pk = `APP#${app}`;
  const sk = `ENV#${env}#SCREEN#${screen}#KEY#${key}`;

  await client.send(
    new PutItemCommand({
      TableName: tableName,
      Item: marshall(
        {
          pk,
          sk,
          app,
          screen,
          key,
          value,
          type,
          status: 'published',
          updatedAt: now,
          updatedBy,
        },
        { removeUndefinedValues: true }
      ),
    })
  );
}

/**
 * Delete a config item by key
 */
export async function deleteConfig(app: string, screen: string, key: string): Promise<void> {
  const tableName = getTableName();
  const env = getEnvironment();
  const pk = `APP#${app}`;
  const sk = `ENV#${env}#SCREEN#${screen}#KEY#${key}`;

  await client.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: marshall({ pk, sk }),
    })
  );
}
