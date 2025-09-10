import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { readFileSync } from 'fs';

(async () => {
  const client = new CloudFrontClient({
    profile: 'profile339713054130',
  });

  const cloudfrontDistributionDomain = 'https://d6jlxxco0708v.cloudfront.net';
  const s3ObjectKey = 'index.html';
  const url = `${cloudfrontDistributionDomain}/${s3ObjectKey}`;
  const privateKey = readFileSync('./private_key.pem');
  console.log('privateKey', privateKey);
  const keyPairId = '442f5e17-a4a1-435d-98e8-184ec257eff3';

  const policy = {
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': 1778764436,
          },
        },
      },
    ],
  };

  const policyString = JSON.stringify(policy);

  const signedUrl = getSignedUrl({
    keyPairId,
    privateKey,
    policy: policyString,
  });

  console.log('IFFE', signedUrl);
  console.log('IFFE');
})();
