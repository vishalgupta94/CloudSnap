import { APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";

import * as cognito from "@aws-sdk/client-cognito-identity";


import {decode} from 'jsonwebtoken'
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("event", event);
    const idToken = event.headers.Authorization;


    if (!idToken) {
      throw new Error("Id token not provided");
    }

    const decodedData = decode(idToken)
    const bucketPrefix = typeof decodedData === 'object' && decodedData !== null ? decodedData.bucketPrefix : undefined;

    if(!bucketPrefix){
      throw new Error("bucketPrefix token not provided");
    }
    console.log("idToken", idToken);
    const id = `cognito-idp.ap-south-1.amazonaws.com/${process.env.userPoolId}`
    const input: cognito.GetOpenIdTokenForDeveloperIdentityCommandInput = {
      IdentityPoolId: process.env.identityPoolId,
      Logins: {
        [id]: idToken,
      },
    };
    console.log("input", input);
    const command = new cognito.GetOpenIdTokenForDeveloperIdentityCommand(input);

    const client = new cognito.CognitoIdentityClient();

    const response = await client.send(command);
    console.log("response", response);

    return {
      statusCode: 200,
      body: JSON.stringify({
        response,
      }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      }
    };
    // if(response.Token && response.IdentityId){
    //   const credentials= await getCredentials(response.IdentityId!, response.Token);
    //   console.log("credentials",credentials)
    //   const getPresignUrl = await getPreSignedUrl(credentials,bucketPrefix )

    //   return {
    //     statusCode: 200,
    //     body: JSON.stringify({
    //       response,
    //     }),
    //   };
    // }

    // return {
    //   statusCode: 400,
    //   body: "Failed to get Token"
    // };


  } catch (e) {
    console.log("event", e);
    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }
};

// const getCredentials = async(id: string, token: string): Promise<cognito.Credentials> => {
//     try{
//         const input: cognito.GetCredentialsForIdentityCommandInput = {
//           IdentityId: id,
//           Logins: {
//               "cognito-identity.amazonaws.com": token
//            }
//         }
//         console.log("response111")
//         const command = new cognito.GetCredentialsForIdentityCommand(input)
//         const client = new cognito.CognitoIdentityClient({
//             region: "ap-south-1",
//         })

//         const response = await client.send(command)
//         console.log("response",response)
//         const creds = response.Credentials
//         if(creds){
//           return creds;
//         }else{
//           throw new Error("Failed to get Credentials")
//         }
//     }catch(err){
//       console.error(err)
//         throw new Error("Failed to get Credentials")
//     }

// }

// const getPreSignedUrl = async (creds: cognito.Credentials, prefix: string): Promise<string> => {
  
//   const s3Client = new S3Client({
//     region: "ap-south-1",
//     credentials: {
//       accessKeyId: creds.AccessKeyId || "",
//       secretAccessKey: creds.SecretKey || "", 
//       sessionToken: creds.SessionToken || "",
//     }
//   });

//   const command = new PutObjectCommand({
//       Bucket: process.env.BUCKET_NAME,
//       Key: `${process.env.BUCKET_PREFIX}/${prefix}`,
//   });

//   const url = await getSignedUrl(s3Client, command, { 
//       expiresIn: 3600, 
//   });

//   return url;

// }

