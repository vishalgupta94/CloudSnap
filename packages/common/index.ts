import * as cognito from '@aws-sdk/client-cognito-identity';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
// import {
//      AssumeRoleWithWebIdentityCommand,
//      AssumeRoleWithWebIdentityCommandInput,

// } from "@aws-sdk/client-sts"
// import { fromIni } from "@aws-sdk/credential-providers"

import { getSignedUrl, S3RequestPresigner } from '@aws-sdk/s3-request-presigner';
// import { Hash } from "@aws-sdk/hash-node";
// import {decode} from 'jsonwebtoken'

// ap-south-1:c2a38ba8-dce4-496b-935f-8c9d4aea67e5

const getIDToken = async (idToken: string) => {
  // const idToken = "eyJraWQiOiIzbmpRRW5udGZVK1d0UVRMVlFmRWh4M2tYamlJMzBGRmZNcERZVkdFYW00PSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiQXZPWnFNLWtwR1FqOENJRTFCZFZSZyIsInN1YiI6IjcxNTM2ZDNhLTMwMjEtNzAxNy04OGJiLTY5MDZiNzdlYjAxYyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGgtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aC0xX0FvZlk1MWxDZyIsImNvZ25pdG86dXNlcm5hbWUiOiI3MTUzNmQzYS0zMDIxLTcwMTctODhiYi02OTA2Yjc3ZWIwMWMiLCJvcmlnaW5fanRpIjoiM2FhZDE3NTMtNWFlOC00NjkyLTg4MDktNDRjZGRiY2U2M2YyIiwiYXVkIjoiNWZlamhkbGkwZmpiYm0zN3RwZTJhZGoycjgiLCJldmVudF9pZCI6IjE5Y2QwNzJjLTAwNGItNGVkYS04ZmFhLWE1ZjVhNDk1ZDUxYiIsInRva2VuX3VzZSI6ImlkIiwiYnVja2V0UHJlZml4IjoiODMyOTJmZDUwNGUzZmEiLCJhdXRoX3RpbWUiOjE3NDU5OTk3NzIsImV4cCI6MTc0NjAwMzM3MiwiaWF0IjoxNzQ1OTk5NzcyLCJqdGkiOiI0NTg2NjZiOS02NWU2LTQ2MDEtOWY1NC00ZThkMTQ3MTkwYjUiLCJlbWFpbCI6InZpc2hhbC5ndXB0YUBhcHBmaXJlLmNvbSJ9.BUqZsWwh7BVf8JGvIXBLDVZKcqzAO6ye1sa_Ft5wa07VPwJ_3q-_OVO3mWGX2mriUgc1qLjNn-UDV7u6j-PfrHnJNXTCYwJR08_63HsrkMbBJwMxVPpGeqXMc2MlY3W1Kjfc0awat1wCzyXmQ7Eyp2mm1PgNI1osEA3QhKOVwY2zi21hc80VaURBz41UJV3md8TM_vbMaoxdJzP1zE094VuxVOp0IKUdG2HcTZ2KIHOYX0Ohg5tv2avJpxoFqnpLRK_YPzpGP5hHNyv86UIPnEhlPxcjInb7fCRf0EkGsjEjRrg8E6pJMxWRz_ghK7Ahq4Kcxvo92AsBHWrRRW27kA"
  // const accessToken = "eyJraWQiOiJGQnNBWlFQV1NzbkVRTmVMV3lsdVRDVXlhekVhMkV6YlE5NjdRNlNPbkpJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI3MTUzNmQzYS0zMDIxLTcwMTctODhiYi02OTA2Yjc3ZWIwMWMiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGgtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aC0xX0FvZlk1MWxDZyIsInZlcnNpb24iOjIsImNsaWVudF9pZCI6IjVmZWpoZGxpMGZqYmJtMzd0cGUyYWRqMnI4Iiwib3JpZ2luX2p0aSI6IjZjMDAxNTBlLWE4NDMtNDk4Mi1hMTVjLTIzMTdjOWU0YjJmNSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4gcGhvbmUgb3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRoX3RpbWUiOjE3NDI2NjMxODYsImV4cCI6MTc0MjY2Njc4NiwiaWF0IjoxNzQyNjYzMTg2LCJqdGkiOiJjNGM4YzZkNy1mZjVjLTQ1MTItYjZkZC04OGI1OTAxNDMzMWQiLCJ1c2VybmFtZSI6IjcxNTM2ZDNhLTMwMjEtNzAxNy04OGJiLTY5MDZiNzdlYjAxYyJ9.aw0sPoz1MBriBRINP0Qk8nc4D0reKgSjf_DGGWXXwUaKHT-YGhh59jJGXsWjrHyLbQpDicg1WcmsgcQDsbBiDH1ELUwLeDbG9IjHnb1-u0UuiPDCMa1yGk6lpXAL4us7s2-EHYjoY0N-4PMfFmoDsHjvSkluDmFHsHaPQsB7bnkvMHuJO_ETrkSFsPI0o1MK0sMF_GYIYi9gCW5fYS9hmND1TPHrDh-VFJTPWN0NB7OlgFpH73naQtqXDhCXimRLax0NjXCLxs7cBbWcg4SgEMEcvvJo7LvWSMFJu1Q0Yt-0qVX5HYRBXexbFMIJ9KfG8vabWXUjejPUbkO4O4Jy7w"
  const input: cognito.GetIdCommandInput = {
    IdentityPoolId: 'ap-south-1:c2a38ba8-dce4-496b-935f-8c9d4aea67e5', //ap-south-1:c2a38ba8-dce4-496b-935f-8c9d4aea67e5",
    Logins: {
      'cognito-idp.ap-south-1.amazonaws.com/ap-south-1_roviuQNHq': idToken,
    },
  };

  try {
    const client = new cognito.CognitoIdentityClient({
      region: 'ap-south-1',
    });
    const command = new cognito.GetIdCommand(input);

    const response = await client.send(command);
    console.log('response', response);
    return response.IdentityId;
    // return {token: response.Token!, id: response.IdentityId!}
  } catch (e) {
    console.log('error getTOken', e);
    throw new Error((e as Error).message);
  }
};

export const getToken = async (identityId: string, idToken: string) => {
  // const idToken = "eyJraWQiOiIzbmpRRW5udGZVK1d0UVRMVlFmRWh4M2tYamlJMzBGRmZNcERZVkdFYW00PSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiQXZPWnFNLWtwR1FqOENJRTFCZFZSZyIsInN1YiI6IjcxNTM2ZDNhLTMwMjEtNzAxNy04OGJiLTY5MDZiNzdlYjAxYyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGgtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aC0xX0FvZlk1MWxDZyIsImNvZ25pdG86dXNlcm5hbWUiOiI3MTUzNmQzYS0zMDIxLTcwMTctODhiYi02OTA2Yjc3ZWIwMWMiLCJvcmlnaW5fanRpIjoiM2FhZDE3NTMtNWFlOC00NjkyLTg4MDktNDRjZGRiY2U2M2YyIiwiYXVkIjoiNWZlamhkbGkwZmpiYm0zN3RwZTJhZGoycjgiLCJldmVudF9pZCI6IjE5Y2QwNzJjLTAwNGItNGVkYS04ZmFhLWE1ZjVhNDk1ZDUxYiIsInRva2VuX3VzZSI6ImlkIiwiYnVja2V0UHJlZml4IjoiODMyOTJmZDUwNGUzZmEiLCJhdXRoX3RpbWUiOjE3NDU5OTk3NzIsImV4cCI6MTc0NjAwMzM3MiwiaWF0IjoxNzQ1OTk5NzcyLCJqdGkiOiI0NTg2NjZiOS02NWU2LTQ2MDEtOWY1NC00ZThkMTQ3MTkwYjUiLCJlbWFpbCI6InZpc2hhbC5ndXB0YUBhcHBmaXJlLmNvbSJ9.BUqZsWwh7BVf8JGvIXBLDVZKcqzAO6ye1sa_Ft5wa07VPwJ_3q-_OVO3mWGX2mriUgc1qLjNn-UDV7u6j-PfrHnJNXTCYwJR08_63HsrkMbBJwMxVPpGeqXMc2MlY3W1Kjfc0awat1wCzyXmQ7Eyp2mm1PgNI1osEA3QhKOVwY2zi21hc80VaURBz41UJV3md8TM_vbMaoxdJzP1zE094VuxVOp0IKUdG2HcTZ2KIHOYX0Ohg5tv2avJpxoFqnpLRK_YPzpGP5hHNyv86UIPnEhlPxcjInb7fCRf0EkGsjEjRrg8E6pJMxWRz_ghK7Ahq4Kcxvo92AsBHWrRRW27kA"
  // const accessToken = "eyJraWQiOiJGQnNBWlFQV1NzbkVRTmVMV3lsdVRDVXlhekVhMkV6YlE5NjdRNlNPbkpJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI3MTUzNmQzYS0zMDIxLTcwMTctODhiYi02OTA2Yjc3ZWIwMWMiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGgtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aC0xX0FvZlk1MWxDZyIsInZlcnNpb24iOjIsImNsaWVudF9pZCI6IjVmZWpoZGxpMGZqYmJtMzd0cGUyYWRqMnI4Iiwib3JpZ2luX2p0aSI6IjZjMDAxNTBlLWE4NDMtNDk4Mi1hMTVjLTIzMTdjOWU0YjJmNSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4gcGhvbmUgb3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRoX3RpbWUiOjE3NDI2NjMxODYsImV4cCI6MTc0MjY2Njc4NiwiaWF0IjoxNzQyNjYzMTg2LCJqdGkiOiJjNGM4YzZkNy1mZjVjLTQ1MTItYjZkZC04OGI1OTAxNDMzMWQiLCJ1c2VybmFtZSI6IjcxNTM2ZDNhLTMwMjEtNzAxNy04OGJiLTY5MDZiNzdlYjAxYyJ9.aw0sPoz1MBriBRINP0Qk8nc4D0reKgSjf_DGGWXXwUaKHT-YGhh59jJGXsWjrHyLbQpDicg1WcmsgcQDsbBiDH1ELUwLeDbG9IjHnb1-u0UuiPDCMa1yGk6lpXAL4us7s2-EHYjoY0N-4PMfFmoDsHjvSkluDmFHsHaPQsB7bnkvMHuJO_ETrkSFsPI0o1MK0sMF_GYIYi9gCW5fYS9hmND1TPHrDh-VFJTPWN0NB7OlgFpH73naQtqXDhCXimRLax0NjXCLxs7cBbWcg4SgEMEcvvJo7LvWSMFJu1Q0Yt-0qVX5HYRBXexbFMIJ9KfG8vabWXUjejPUbkO4O4Jy7w"
  const input: cognito.GetCredentialsForIdentityInput = {
    IdentityId: identityId,
    Logins: {
      'cognito-idp.ap-south-1.amazonaws.com/ap-south-1_roviuQNHq': idToken,
    },
    // CustomRoleArn: 'arn:aws:iam::339713054130:role/service-role/test-role-to-delete'
  };
  //   const command = new cognito.GetOpenIdTokenForDeveloperIdentityCommand(input)

  try {
    const client = new cognito.CognitoIdentityClient({
      region: 'ap-south-1',
    });
    const command = new cognito.GetCredentialsForIdentityCommand(input);

    const response = await client.send(command);
    console.log('response', response);
    return response.Credentials;
    // return {token: response.Token!, id: response.IdentityId!}
  } catch (e) {
    console.log('error getTOken', e);
    throw new Error((e as Error).message);
  }
};

export const getUrl = async (creds: cognito.Credentials) => {
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
    Key: '83292fd504e3fa/abcd1',
    ContentType: 'image/png',
  });
  const url = await getSignedUrl(client2, command, {
    expiresIn: 3600,
  });

  console.log('url', url);
};

(async () => {
  const id =
    'eyJraWQiOiJySWN3NFNIVVlBblM2TVI1Sk50Q1RPZkFmcWVhR2FuR0hVeVV5bVRRZlhRPSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiZEhNLXhEU1FQdVFtbGpEUmxTc1ZaZyIsInN1YiI6ImIxOTM0ZDRhLWMwMDEtNzBkMS0wM2I5LTgyNWEzZTdhZjliNSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGgtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aC0xX3Jvdml1UU5IcSIsImNvZ25pdG86dXNlcm5hbWUiOiJiMTkzNGQ0YS1jMDAxLTcwZDEtMDNiOS04MjVhM2U3YWY5YjUiLCJvcmlnaW5fanRpIjoiZjA3NWU3MzEtMzA1YS00YzUyLThhZWMtNWJlNWY1OTU2MmVmIiwiYXVkIjoiMjc2aGkzb2VodG1mamFtdGViMzVxM2NscnUiLCJldmVudF9pZCI6IjIyYjkyYTVjLTkzNDMtNDE3NC1hNDNlLWFhOGI0MGVkNDliMCIsInRva2VuX3VzZSI6ImlkIiwiYnVja2V0UHJlZml4IjoiODMyOTJmZDUwNGUzZmEiLCJhdXRoX3RpbWUiOjE3NTc1MTg3OTEsImV4cCI6MTc1NzUyMjM5MSwiaWF0IjoxNzU3NTE4NzkxLCJqdGkiOiJjNDA5YzFiMC0zNjQzLTRlMDItODlhNy1mMzgzNTNiNDVmZmYiLCJlbWFpbCI6InZpc2hhbC5ndXB0YUBhcHBmaXJlLmNvbSJ9.G7DyibJFBQODb-Wm_McHZklBSICCT-zKJhtibUp8a92ADiimMfdh4gkmtG3vh0JA4A7AjOwbbDNVWq9X4hvbBUhVDkp519fmn1ZmFzuOpDlRXjxsZOtUu0At679Xb32iQu4SQ9Ru8Si9xumsGVR2gwFXNyRf3m4pVwBLn8Lc5--ux9Mw0eF-iqe9bR3lx6CbW0AeA7Fsm8Uh2vFOuMWR7449Tvp8wvWk6TMe91uvvyAp8DUVB1fE50A7XTZYWc-zKrfwD5oOqbueZlOKhwAV9wxs7qgpSmvna-B6Wmal8l7LY0LL_BM0jDGnOOjSm10JHV2C5-zBi6_-vNtetCXBVA';

  const identityId = await getIDToken(id);
  console.log('identityId', identityId);
  const obbj = await getToken(identityId!, id);
  const abcd = getUrl(obbj!);
  console.log('obbj', obbj);
})();
