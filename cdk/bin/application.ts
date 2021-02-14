#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CloudfrontStack } from '../lib/cloudfront/cloudfront-stack';
import { ApiGatewayWithServicesStack} from '../lib/api-gateway-with-services/api-gateway-with-services-stack';

const app = new cdk.App();

// Why can't we just have 1 nonprod using api gateway stages to separate non prod envs???
const account = '250449838316';
const branch = 'develop';
const appId = 'fake_app_id';
const dcl = '2';

const props = {
  ohioEnv: {account: account, region: 'us-east-2'},
  virginaEnv: {account: account, region: 'us-east-1'},
  californiaEnv: {account: account, region: 'us-west-1'},
  hostedZoneId: 'Z275IOSIZOS9QZ',
  hostedZoneName: 'nonprodyconnect.net',
  originDomainName: 'origin-millionrpm-api.nonprodyconnect.net',
  cloudfrontDomainName: 'millionrpm-api.nonprodyconnect.net',
  cloudfrontCertArn: 'arn:aws:acm:us-east-1:250449838316:certificate/35c12766-be12-4b28-9ae2-3bfc19ce2856',
  ohioDomainName: 'ohio-origin-millionrpm-api.nonprodyconnect.net',
  ohioCertArn: 'arn:aws:acm:us-east-2:250449838316:certificate/5efcd3c0-6936-4fbe-a8b4-5a335a03e5d2',
  californiaDomainName: 'california-origin-millionrpm-api.nonprodyconnect.net',
  californiaCertArn: 'arn:aws:acm:us-west-1:250449838316:certificate/85c75022-5b72-4192-8de2-d0d0222745f3'
}

const cloudfrontStack = new CloudfrontStack(app, 'MillionRpmCloudfront-'+branch,{
  env: props.virginaEnv,
  hostedZoneId: props.hostedZoneId,
  hostedZoneName: props.hostedZoneName,
  originDomainName: props.originDomainName,
  cloudfrontDomainName: props.cloudfrontDomainName,
  cloudfrontCertArn: props.cloudfrontCertArn,
  originRecordSets: [
    {
      Name: props.originDomainName,
      Type: 'CNAME',
      TTL: '900',
      SetIdentifier: 'USPrimary',
      GeoLocation:{ContinentCode: 'NA'},
      ResourceRecords: [props.ohioDomainName]
    },
    {
      Name: props.originDomainName,
      Type: 'CNAME',
      TTL: '900',
      SetIdentifier: 'USSecondary',
      GeoLocation:{CountryCode: 'US'},
      ResourceRecords: [props.californiaDomainName]
    }
  ]
});

const ohioApigatewayWithServices = new ApiGatewayWithServicesStack(app,'MillionRpmServices-'+branch,{
  env: props.ohioEnv,
  hostedZoneId: props.hostedZoneId,
  hostedZoneName: props.hostedZoneName,
  regionDomainName: props.ohioDomainName,
  regionCertArn: props.ohioCertArn,
  originDomainName: props.originDomainName,
  originCertArn: props.ohioCertArn
});

const californiaApigatewayWithServices = new ApiGatewayWithServicesStack(app,'MillionRpmServicesCal-'+branch,{
  env: props.californiaEnv,
  hostedZoneId: props.hostedZoneId,
  hostedZoneName: props.hostedZoneName,
  regionDomainName: props.californiaDomainName,
  regionCertArn: props.californiaCertArn,
  originDomainName: props.originDomainName,
  originCertArn: props.californiaCertArn
});

cdk.Tags.of(cloudfrontStack).add('t_AppId',appId);
cdk.Tags.of(cloudfrontStack).add('t_dcl',dcl);
cdk.Tags.of(ohioApigatewayWithServices).add('t_AppId',appId);
cdk.Tags.of(ohioApigatewayWithServices).add('t_dcl',dcl);




