import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Effect, FederatedPrincipal, OpenIdConnectProvider, Policy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';

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


  attachPermissions(role: Role){

    const region = 'ap-south-1';
    const account = '339713054130';
    
    const assetsBucketArn     = `arn:aws:s3:::cdk-hnb659fds-assets-${account}-${region}`;
    const assetsBucketObjects = `${assetsBucketArn}/*`;

    const policy = new Policy(this,"policy", {
      statements: [
          // CloudFormation stack operations
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'cloudformation:CreateStack','cloudformation:UpdateStack','cloudformation:DeleteStack',
              'cloudformation:CreateChangeSet','cloudformation:ExecuteChangeSet','cloudformation:DeleteChangeSet',
              'cloudformation:Describe*','cloudformation:List*','cloudformation:ValidateTemplate',
              'cloudformation:TagResource','cloudformation:UntagResource','cloudformation:SetStackPolicy'
            ],
            resources: ['*'],
          }),
          // Publish CDK file assets to the bootstrap bucket
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              's3:PutObject','s3:GetObject','s3:DeleteObject','s3:AbortMultipartUpload',
              's3:ListBucket','s3:GetBucketLocation','s3:ListBucketMultipartUploads'
            ],
            resources: [assetsBucketArn, assetsBucketObjects],
          }),
          // If your bootstrap bucket uses KMS (optional — remove if not needed)
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'kms:Encrypt','kms:Decrypt','kms:ReEncrypt*','kms:GenerateDataKey*','kms:DescribeKey'
            ],
            resources: [`arn:aws:kms:${region}:${account}:key/*`],
            conditions: { StringEquals: { 'kms:ViaService': `s3.${region}.amazonaws.com` } },
          }),
          // (Optional) Docker assets to ECR
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'ecr:GetAuthorizationToken', // must be "*"
              'ecr:CreateRepository','ecr:DescribeRepositories','ecr:SetRepositoryPolicy','ecr:TagResource',
              'ecr:PutImage','ecr:BatchGetImage','ecr:BatchCheckLayerAvailability',
              'ecr:InitiateLayerUpload','ecr:UploadLayerPart','ecr:CompleteLayerUpload','ecr:GetDownloadUrlForLayer'
            ],
            resources: ['*'],
          }),
          // (Optional) Pass a CloudFormation service role you created for execution
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['iam:PassRole'],
            resources: [`arn:aws:iam::${account}:role/cfn-exec-role`],
            conditions: { StringEquals: { 'iam:PassedToService': 'cloudformation.amazonaws.com' } },
          }),
          // (Optional) Lookups during synth (VPC/SSM)
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['ssm:GetParameter','ssm:GetParameters','ec2:Describe*'],
            resources: ['*'],
          }),
      ]
    })
    role.attachInlinePolicy(policy)

  }
}
