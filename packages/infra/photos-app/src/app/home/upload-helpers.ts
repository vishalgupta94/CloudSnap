import * as cognito from '@aws-sdk/client-cognito-identity';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const getIdentityId = async (): Promise<string> => {
  const idToken = localStorage.getItem('idToken');

  if (!idToken) {
    throw new Error('ID Token not found');
  }

  const input: cognito.GetIdCommandInput = {
    IdentityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
    Logins: {
      [process.env.NEXT_PUBLIC_COGNITO_LOGIN as string]: idToken,
    },
  };

  try {
    const client = new cognito.CognitoIdentityClient({
      region: 'ap-south-1',
    });
    const command = new cognito.GetIdCommand(input);
    const response = await client.send(command);
    console.log('response1', response);

    const identityId = response.IdentityId;

    if (!identityId) {
      throw new Error('Identity not found');
    }
    return identityId;
  } catch (e) {
    console.log('error getTOken', e);
    throw new Error((e as Error).message);
  }
};

export const getCredentials = async (
  identityId: string,
): Promise<cognito.Credentials | undefined> => {
  const idToken = localStorage.getItem('idToken');

  if (!idToken) {
    throw new Error('ID Token not found');
  }

  const input: cognito.GetCredentialsForIdentityInput = {
    IdentityId: identityId,
    Logins: {
      [process.env.NEXT_PUBLIC_COGNITO_LOGIN as string]: idToken,
    },
  };

  try {
    const client = new cognito.CognitoIdentityClient({
      region: 'ap-south-1',
    });
    const command = new cognito.GetCredentialsForIdentityCommand(input);

    const response = await client.send(command);
    console.log('response2', response);
    return response.Credentials;
    // return {token: response.Token!, id: response.IdentityId!}
  } catch (e) {
    console.log('error getTOken', e);
    throw new Error((e as Error).message);
  }
};
export const getPresignedSignedUrl = async (
  key: string,
  creds: cognito.Credentials | undefined,
): Promise<string> => {
  const client2 = new S3Client({
    region: 'ap-south-1',
    credentials: {
      accessKeyId: creds?.AccessKeyId || '',
      secretAccessKey: creds?.SecretKey || '',
      sessionToken: creds?.SessionToken || '',
    },
  });

  const command = new PutObjectCommand({
    Bucket: 'cloud-snap-photos',
    Key: `83292fd504e3fa/${key}`,
    ContentType: 'image/png',
  });

  const url = await getSignedUrl(client2, command, {
    expiresIn: 3600,
  });

  return url;
};
