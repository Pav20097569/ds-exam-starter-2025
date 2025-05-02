import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  DynamoDBClient
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand
} from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();
const TABLE_NAME = process.env.MOVIES_TABLE!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    const role = event.pathParameters?.role;
    const movieId = event.pathParameters?.movieId;
    const verbose = event.queryStringParameters?.verbose === "true";

    if (!role || !movieId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing role or movieId" }),
      };
    }

    const result = await client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { movieId },
      })
    );

    const movie = result.Item;

    if (!movie) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Movie not found" }),
      };
    }

    const crew = movie.crew || [];

    const responseBody = verbose
      ? crew
      : crew.find((member: any) => member.role === role) || {};

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(responseBody),
    };
  } catch (error: any) {
    console.error("Error:", JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};


function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  return DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });
}
