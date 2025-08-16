import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Role, ServicePrincipal, FederatedPrincipal, PolicyStatement, PolicyDocument, Effect } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { LambdaIntegration, RequestAuthorizer, RestApi , CognitoUserPoolsAuthorizer, IdentitySource, Cors} from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import { HttpMethod } from "aws-cdk-lib/aws-events";

export class CognitoStack extends Stack {

  private readonly domainPrefix: string;
  private readonly loginURL: string;
  private readonly logoutURL: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.domainPrefix = "photos-snap-domain",
    this.loginURL = "http://localhost:3000/login";
    this.logoutURL = "http://localhost:3000/logout";

    const userPool = this.generateUserPool();
    this.attachPreTokenLambda(userPool);
    this.attachClient(userPool);
    this.attachDomain(userPool);

  }

  generateUserPool(): cognito.UserPool{

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "cloudSnap",
      mfa: cognito.Mfa.OFF,
      email: cognito.UserPoolEmail.withCognito(),
      signInAliases: {
        email: true,
      },
      selfSignUpEnabled: true,
    });
    userPool.applyRemovalPolicy(RemovalPolicy.DESTROY);
    
    return userPool
  }

  attachPreTokenLambda(userPool: cognito.UserPool){
    const preTokenLambda = new NodejsFunction(this, "function", {
      handler: "handler",
      entry: join(process.cwd(), "handlers/pre-token/index.ts"),
    });
    preTokenLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

    userPool.addTrigger(cognito.UserPoolOperation.PRE_TOKEN_GENERATION, preTokenLambda);
  }

  attachClient(userPool: cognito.UserPool){
    const redirectUriLocal = this.loginURL;

    const client = userPool.addClient("client", {
      generateSecret: true,
      userPoolClientName: "photos-client",
      oAuth: {
        callbackUrls: [redirectUriLocal],
        logoutUrls: [this.logoutURL],
        flows: { authorizationCodeGrant: true, implicitCodeGrant: false },
      },
    });

    client.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // client id
    new CfnOutput(this, "id", {
      value: client.userPoolClientId,
    });
  }

  attachDomain(userPool: cognito.UserPool){
    const domain = userPool.addDomain("domain", {
      cognitoDomain: {
        domainPrefix: this.domainPrefix
      },
    });
    
  }


}
