import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as cloudfrontOrigins from '@aws-cdk/aws-cloudfront-origins';
import * as r53 from '@aws-cdk/aws-route53';
import * as r53targets from '@aws-cdk/aws-route53-targets';
import * as acm from '@aws-cdk/aws-certificatemanager';


export interface RecordSet{
  Name: string,
  Type: string,
  TTL: string,
  SetIdentifier: string,
  GeoLocation:{ContinentCode?: string, CountryCode?: string, SubdivisionCode?: string},
  ResourceRecords: [string]
}

export interface CloudfrontProps extends cdk.StackProps{
  hostedZoneId: string,
  hostedZoneName: string,
  originDomainName: string,
  cloudfrontDomainName: string,
  cloudfrontCertArn: string,
  originRecordSets: RecordSet[]
}

export class CloudfrontStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: CloudfrontProps) {
    super(scope, id, props);

    // Create cloudfront distribution
    const cloudfrontDistribution = new cloudfront.Distribution(this, 'CloudfrontDistribution',{
      defaultBehavior: {origin: new cloudfrontOrigins.HttpOrigin(props.originDomainName)},
      domainNames: [props.cloudfrontDomainName],
      certificate: acm.Certificate.fromCertificateArn(this, id+'CloudfrontDomainCert', props.cloudfrontCertArn)
    });

    //const hostedZoneRef = r53.HostedZone.fromHostedZoneId(this,id+'CloudfrontHostedZoneRef',props.hostedZoneId);
    const hostedZoneRef = r53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone',{
      hostedZoneId: props.hostedZoneId,
      zoneName: props.hostedZoneName
    });

    // Create alias record to Cloudfront with primary DNS name from us-east-1.
    const cloudfrontMappingAlias = new r53.ARecord(this, 'CloudFrontARecord', {
      zone: hostedZoneRef,
      recordName: props.cloudfrontDomainName,
      target: r53.RecordTarget.fromAlias(new r53targets.CloudFrontTarget(cloudfrontDistribution))
    });

    // Add regional API Gateway DNS to Record Group Set for geo routing
    const originCfnRecordSetGroup = new cdk.CfnResource(this, 'OriginRecordSetGroup', {
      type: 'AWS::Route53::RecordSetGroup',
      properties: {
        HostedZoneId: props.hostedZoneId,
        RecordSets: props.originRecordSets
      }
    });

  }

}
