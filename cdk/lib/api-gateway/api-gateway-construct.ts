import * as cdk from '@aws-cdk/core';
import * as apigw2 from '@aws-cdk/aws-apigatewayv2';
import * as logs from '@aws-cdk/aws-logs';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as r53 from '@aws-cdk/aws-route53';
import * as r53targets from '@aws-cdk/aws-route53-targets';

export interface ApiGatewayProps {
  hostedZone: r53.IHostedZone,
  regionDomainName: string,
  regionCertArn: string,
  originDomainName: apigw2.DomainName
  defaultIntegration: apigw2.IHttpRouteIntegration,
  apiName?: string,
  description?: string,
  disableExecuteApiEndpoint?: boolean,
  corsPreflight?: apigw2.CorsPreflightOptions
}

export class ApiGatewayConstruct extends cdk.Construct {
  
  protected apiEndpoint: string;
  protected httpApiName: string;
  protected httpApiId: string;
  protected defaultStage: apigw2.HttpStage;
  protected url: string;
  private _httpApi: apigw2.HttpApi;

  constructor(scope: cdk.Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    const httpApigwDomainName = new apigw2.DomainName(this, 'ApigwDomainName',{
      domainName: props.regionDomainName,
      certificate: acm.Certificate.fromCertificateArn(this, 'ApigwDomainCert', props.regionCertArn)
    });

    this._httpApi = new apigw2.HttpApi(this, 'ApigwHttpPrivateInt',{
      defaultIntegration: props.defaultIntegration,
      defaultDomainMapping: {domainName: httpApigwDomainName}
    });

    // Setup Http API logging
    const accessLogGroup = new logs.LogGroup(this,'AccessLogGroup',{});
    
    if(this._httpApi.defaultStage){
      const cfnStage = this._httpApi.defaultStage.node.defaultChild as apigw2.CfnStage;
      cfnStage.accessLogSettings = {destinationArn: accessLogGroup.logGroupArn, format:'{ "requestId":"$context.requestId", "ip": "$context.identity.sourceIp", "caller":"$context.identity.caller", "path":"$context.path", "user":"$context.identity.user","requestTime":"$context.requestTime", "responseLatency": "$context.responseLatency", "httpMethod":"$context.httpMethod", "status":"$context.status", "protocol":"$context.protocol", "responseLength":"$context.responseLength" }'};
    }

    // Add mapping to allow calls from cdn using origin 
    const originHttpApiMapping = new apigw2.HttpApiMapping(this,'CloudfrontToApigwMapping',{
      api: this._httpApi,
      domainName: props.originDomainName
    });

    const ohioOriginAliasRecord = new r53.ARecord(this, 'OhioOriginARecord', {
      zone: props.hostedZone,
      recordName: props.regionDomainName,
      target: r53.RecordTarget.fromAlias(new r53targets.ApiGatewayv2Domain(httpApigwDomainName))
    });
  }

  public addRoutes(options: apigw2.AddRoutesOptions): void {
    this._httpApi.addRoutes(options);
  }
}