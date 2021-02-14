import * as cdk from '@aws-cdk/core';
import * as apigw2 from '@aws-cdk/aws-apigatewayv2';
import {ApiGatewayConstruct} from './api-gateway-construct';
import * as r53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';


export interface ApiGatewayProps extends cdk.NestedStackProps{
  hostedZoneId: string,
  hostedZoneName: string,
  regionDomainName: string,
  regionCertArn: string,
  originDomainName: string,
  originCertArn: string,
  defaultIntegration: apigw2.IHttpRouteIntegration,
  apiName?: string,
  description?: string,
  disableExecuteApiEndpoint?: boolean,
  corsPreflight?: apigw2.CorsPreflightOptions
}

export class ApiGatewayStack extends cdk.NestedStack {

  public apiGatewayConstruct: ApiGatewayConstruct;

  constructor(scope: cdk.Construct, id: string, props: ApiGatewayProps) {
    super(scope, id, props);

    const hostedZone = r53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone',{
      hostedZoneId: props.hostedZoneId,
      zoneName: props.hostedZoneName
    });

    this.apiGatewayConstruct = new ApiGatewayConstruct(this,'ApiGateway',{
      hostedZone: hostedZone,
      regionDomainName: props.regionDomainName,
      regionCertArn: props.regionCertArn,
      originDomainName: new apigw2.DomainName(this, 'OriginDomainName',{
        domainName: props.originDomainName,
        certificate: acm.Certificate.fromCertificateArn(this,'OriginCert',props.originCertArn)
      }),
      defaultIntegration: props.defaultIntegration,
      apiName: props.apiName,
      description: props.description,
      disableExecuteApiEndpoint: props.disableExecuteApiEndpoint,
      corsPreflight: props.corsPreflight
    });



  }
}