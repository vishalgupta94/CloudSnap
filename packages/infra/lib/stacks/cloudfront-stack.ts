import * as cdk from "aws-cdk-lib";
import { Distribution } from "aws-cdk-lib/aws-cloudfront";
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { join } from "path";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import path = require("path");

export class Cloudfront extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "S3", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      accessControl: BucketAccessControl.PRIVATE,
      enforceSSL: true,
    });

    new BucketDeployment(this, "BucketDeployment", {
      sources: [Source.asset(path.join(__dirname, "client"))],
      destinationBucket: bucket,
    });

    const distribution = new Distribution(this, "Cloudfront", {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket),
      },
    });

    new cdk.CfnOutput(this, "id", {
      value: distribution.distributionDomainName,
    });
  }
}
