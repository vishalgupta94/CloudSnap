#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OIDCStack } from '../lib/stacks/oidc-stack';
import { CognitoStack } from '../lib/stacks/cognito-stack';

const app = new cdk.App();

new OIDCStack(app, 'InfraStack', {
  env: { account: '339713054130', region: 'ap-south-1' },
});

new CognitoStack(app, 'CognitoStack', {
  env: { account: '339713054130', region: 'ap-south-1' },
});