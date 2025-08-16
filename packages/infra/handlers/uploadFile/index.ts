import { APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";

import * as cognito from "@aws-sdk/client-cognito-identity";
import { GetObjectCommand, PutObjectCommand, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import {
  AssumeRoleWithWebIdentityCommand,
  AssumeRoleWithWebIdentityCommandInput,
} from "@aws-sdk/client-sts";
// import { fromIni } from "@aws-sdk/credential-providers";

import { getSignedUrl, S3RequestPresigner } from "@aws-sdk/s3-request-presigner";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
   console.log("Event",JSON.stringify(event))
  return {
   statusCode: 200,
   body: JSON.stringify({
   }),
   headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
   }
  };
};
