import { PreTokenGenerationTriggerEvent, PreTokenGenerationTriggerHandler } from 'aws-lambda';
import { createHash } from 'crypto';

export const handler: PreTokenGenerationTriggerHandler = async (
  event: PreTokenGenerationTriggerEvent,
) => {
  console.log('event', event);
  const email = event.request.userAttributes['email'];

  if (!email) {
    throw new Error('email not found');
  }

  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        bucketPrefix: createHash('md5').update(email).digest('hex').substring(0, 14),
      },
    },
  };
  return event;
};

// ```
// {
//   version: '1',
//   triggerSource: 'TokenGeneration_HostedAuth',
//   region: 'ap-south-1',
//   userPoolId: 'ap-south-1_AofY51lCg',
//   userName: '71536d3a-3021-7017-88bb-6906b77eb01c',
//   callerContext: {
//     awsSdkVersion: 'aws-sdk-unknown-unknown',
//     clientId: '5fejhdli0fjbbm37tpe2adj2r8'
//   },
//   request: {
//     userAttributes: {
//       sub: '71536d3a-3021-7017-88bb-6906b77eb01c',
//       email_verified: 'true',
//       'cognito:user_status': 'CONFIRMED',
//       email: 'vishal.gupta@appfire.com'
//     },
//     groupConfiguration: {
//       groupsToOverride: [],
//       iamRolesToOverride: [],
//       preferredRole: null
//     }
//   },
//   response: { claimsOverrideDetails: null }
// }
//   ```
