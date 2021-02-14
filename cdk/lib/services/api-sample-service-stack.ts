import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecsPattern from '@aws-cdk/aws-ecs-patterns';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2'

export interface ApiSampleServiceProps extends cdk.NestedStackProps{
  vpc: ec2.IVpc
}

export class ApiSampleServiceStack extends cdk.NestedStack {
  public listener: elb.INetworkListener;

  constructor(scope: cdk.Construct, id: string, props: ApiSampleServiceProps) {
    super(scope, id, props);

    // This is just one app that can be routed to by API Gateway
    const ecsNlbFargatePattern = new ecsPattern.NetworkLoadBalancedFargateService(this,'FargatePattern',{
      vpc: props.vpc,
      enableECSManagedTags: true,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      publicLoadBalancer: false,
      listenerPort: 80,
      taskImageOptions: {
        image: ecs.ContainerImage.fromDockerImageAsset(new DockerImageAsset(this, 'sample-nestjs', {directory: 'container-image'})),
        containerPort: 3000,
        enableLogging: true
      }
    });

    this.listener = ecsNlbFargatePattern.listener;

    ecsNlbFargatePattern.service.connections.allowFromAnyIpv4(ec2.Port.tcpRange(32768,65535));
    ecsNlbFargatePattern.service.connections.allowFromAnyIpv4(ec2.Port.tcp(3000));
    ecsNlbFargatePattern.targetGroup.configureHealthCheck({
      enabled: true,
      port: '3000'
    });
  }
}