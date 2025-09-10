import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  return Promise.resolve({
    statusCode: 200,
    body: JSON.stringify({
      message: 'emessage',
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Header': '*',
    },
  });
};

// module.exports = { handler };
