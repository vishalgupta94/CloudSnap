import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FederatedPrincipal, OpenIdConnectProvider, Role } from 'aws-cdk-lib/aws-iam';

export class OIDCStack extends cdk.Stack {
  private oidc: OpenIdConnectProvider

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const oidcProvider = this.createOIDCProvider()
    this.createIAMRole(oidcProvider)

  }

  createOIDCProvider(){    
    return  new OpenIdConnectProvider(this,"Github-OIDC",{
        url: "https://token.actions.githubusercontent.com",
        clientIds: ['sts.amazonaws.com'],
    })    
  }

  createIAMRole(oidcProvider: OpenIdConnectProvider) {

    const conditions = {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:vishalgupta94/CloudSnap:ref:refs/heads/main`
        },
      };


    const iamRole = new Role(this, 'GitHubDeployRole', {
        roleName: "github-action-photosnap-cdk-deploy",
        description: "This role is used by github to perform cdk deploy",
        assumedBy: new FederatedPrincipal(oidcProvider.openIdConnectProviderArn,
        conditions,
        'sts:AssumeRoleWithWebIdentity')
    })

    new cdk.CfnOutput(this, "GitHubDeployRoleArn", {
        value: iamRole.roleArn,
        exportName: "GitHubDeployRoleArn"
    })


  }
}
