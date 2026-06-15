import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "fs";

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:8002",
  credentials: {
    accessKeyId: "dummy",
    secretAccessKey: "dummy"
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function run() {
  // Check and create table if it doesn't exist
  try {
    await client.send(new DescribeTableCommand({ TableName: "node" }));
    console.log("Table 'node' already exists.");
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      console.log("Table 'node' not found. Creating table...");
      await client.send(
        new CreateTableCommand({
          TableName: "node",
          AttributeDefinitions: [
            { AttributeName: "node_id", AttributeType: "S" }
          ],
          KeySchema: [
            { AttributeName: "node_id", KeyType: "HASH" }
          ],
          BillingMode: "PAY_PER_REQUEST"
        })
      );
      console.log("Table 'node' created successfully.");
    } else {
      throw error;
    }
  }

  const raw = fs.readFileSync("data/nodes.json", "utf-8");
  const items = JSON.parse(raw);

  console.log(`Seeding ${items.length} items...`);
  for (const item of items) {
    await docClient.send(
      new PutCommand({
        TableName: "node",
        Item: item
      })
    );
  }
  console.log("Seeding completed successfully.");
}

run().catch(console.error);