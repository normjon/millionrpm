import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import {ApiSampleServiceStack} from '../services/api-sample-service-stack'
import * as apigwIntegrations from '@aws-cdk/aws-apigatewayv2-integrations';
import * as apigw from '@aws-cdk/aws-apigatewayv2';
import {ApiGatewayStack} from '../api-gateway/api-gateway-stack';

export interface ApiGatewayWithServicesProps extends cdk.StackProps{
  hostedZoneId: string
  hostedZoneName: string,
  regionDomainName: string,
  regionCertArn: string,
  originDomainName: string,
  originCertArn: string
}

export class ApiGatewayWithServicesStack extends cdk.Stack{
  constructor(scope: cdk.Construct, id: string, props: ApiGatewayWithServicesProps){
    super(scope, id, props);

    const vpc = new ec2.Vpc(this,'Vpc')

    const apiSampleServiceStack = new ApiSampleServiceStack(this,'SampleService',{
      vpc: vpc
    });

    const vpcLinkHttp = new apigw.VpcLink(this,'HttpVpcLink',{
      vpc: vpc
    });

    const apiGatewayNlbIntegration = new apigwIntegrations.HttpNlbIntegration({
      listener: apiSampleServiceStack.listener,
      vpcLink: vpcLinkHttp
    });

    const apiGateway = new ApiGatewayStack(this, 'ApiGateway',{
      hostedZoneId: props.hostedZoneId,
      hostedZoneName: props.hostedZoneName,
      regionDomainName: props.regionDomainName,
      regionCertArn: props.regionCertArn,
      originDomainName: props.originDomainName,
      originCertArn: props.originCertArn,
      defaultIntegration: apiGatewayNlbIntegration
    });

  }
  
}