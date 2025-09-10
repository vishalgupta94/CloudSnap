import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import {
  Role,
  ServicePrincipal,
  FederatedPrincipal,
  PolicyStatement,
  PolicyDocument,
  Effect,
  ManagedPolicy,
  Policy,
} from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  LambdaIntegration,
  RequestAuthorizer,
  RestApi,
  CognitoUserPoolsAuthorizer,
  IdentitySource,
  Cors,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { IdentityPool, UserPoolAuthenticationProvider,  } from 'aws-cdk-lib/aws-cognito-identitypool';

export class CognitoStack extends Stack {
  private readonly domainPrefix: string;
  private readonly loginURL: string;
  private readonly logoutURL: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    ((this.domainPrefix = 'photos-snap-domain'),
      (this.loginURL = 'http://localhost:3000/login'));
    this.logoutURL = 'http://localhost:3000/logout';

    const userPool = this.generateUserPool();
    this.attachPreTokenLambda(userPool);
    const client = this.attachClient(userPool);
    this.attachDomain(userPool);

    this.createIdentityPool(userPool, client);
  }

  createIdentityPool(userPool: cognito.UserPool, client: cognito.UserPoolClient) {

    const identityPool = new IdentityPool(this, 'MyIdentityPool', {
      identityPoolName: 'CloudSanpIdentityPool',
      allowUnauthenticatedIdentities: false,
    });

    const provider = new UserPoolAuthenticationProvider({
      userPool,
      userPoolClient: client
    })

    identityPool.addUserPoolAuthentication(provider)

    const inlinePolicy = new Policy(this, 'InlineS3Policy', {
      statements: [
        new PolicyStatement({
          sid: 'ListObjectsInInvoices',
          effect: Effect.ALLOW,
          actions: ['s3:ListBucket'],
          resources: ['arn:aws:s3:::cloud-snap-photos'],
          conditions: {
            StringLike: {
              's3:prefix': [
                '${aws:PrincipalTag/bucketPrefix}/*',
                '${aws:PrincipalTag/bucketPrefix}/',
              ],
            },
          },
        }),
        new PolicyStatement({
          sid: 'RWDeleteInvoices',
          effect: Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:GetObjectVersion',
            's3:PutObject',
            's3:DeleteObject',
            's3:DeleteObjectVersion',
          ],
          resources: [
            'arn:aws:s3:::cloud-snap-photos/${aws:PrincipalTag/bucketPrefix}/*',
          ],
        }),
        new PolicyStatement({
          sid: 'GetCredentials',
          effect: Effect.ALLOW,
          actions: [
            'cognito-identity:GetCredentialsForIdentity',
          ],
          resources: [
            "*"
          ],
        }),
      ],
    });

    identityPool.authenticatedRole.attachInlinePolicy(inlinePolicy)

    new cognito.CfnIdentityPoolPrincipalTag(this, 'PrincipalTagMap', {
      identityPoolId: identityPool.identityPoolId,
      identityProviderName: `cognito-idp.ap-south-1.amazonaws.com/${userPool.userPoolId}`,
      principalTags: {
        // Maps ID token claim "custom:bucketPrefix" to principal tag key "bucketPrefix"
        bucketPrefix: 'bucketPrefix',
        // More examples you can leverage in IAM policies:
        // department: 'custom:department',
        // email: 'email',
        // sub: 'sub',
      },
      useDefaults: false, // set true to include default mappings (username/clientId)
    });

  }

  generateUserPool(): cognito.UserPool {
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'cloudSnap',
      mfa: cognito.Mfa.OFF,
      email: cognito.UserPoolEmail.withCognito(),
      signInAliases: {
        email: true,
      },
      selfSignUpEnabled: true,
    });
    userPool.applyRemovalPolicy(RemovalPolicy.DESTROY);

    new CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId,
    });

    return userPool;
  }

  attachPreTokenLambda(userPool: cognito.UserPool) {
    const preTokenLambda = new NodejsFunction(this, 'function', {
      handler: 'handler',
      entry: join(process.cwd(), 'handlers/pre-token/index.ts'),
    });
    preTokenLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

    userPool.addTrigger(
      cognito.UserPoolOperation.PRE_TOKEN_GENERATION,
      preTokenLambda,
    );
  }

  attachClient(userPool: cognito.UserPool) {
    const redirectUriLocal = this.loginURL;

    const client = userPool.addClient('client', {
      generateSecret: true,
      userPoolClientName: 'photos-client',
      oAuth: {
        callbackUrls: [redirectUriLocal],
        logoutUrls: [this.logoutURL],
        flows: { authorizationCodeGrant: true, implicitCodeGrant: false },
      },
    });

    client.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // client id
    new CfnOutput(this, 'id', {
      value: client.userPoolClientId,
    });

    return client
  }

  attachDomain(userPool: cognito.UserPool) {
    const domain = userPool.addDomain('domain', {
      cognitoDomain: {
        domainPrefix: this.domainPrefix,
      },
    });

    // client id
  }
}
