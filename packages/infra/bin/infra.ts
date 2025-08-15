#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OIDCStack } from '../lib/stacks/oidc-stack';

const app = new cdk.App();
new OIDCStack(app, 'InfraStack', {
  env: { account: '339713054130', region: 'ap-south-1' },
});