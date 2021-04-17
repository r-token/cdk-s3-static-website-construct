import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import s3deploy = require('@aws-cdk/aws-s3-deployment');
import cf = require('@aws-cdk/aws-cloudfront')
import iam = require('@aws-cdk/aws-iam')

export interface S3StaticWebsiteConstructProps extends cdk.StackProps {
    projectName: string,
    s3WebsiteDeploySource: string,
    websiteIndexDocument: string,
    websiteErrorDocument: string,
    cdnWebsiteIndexDocument: string,
    cdnComment: string
}

export class S3StaticWebsiteConstruct extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: S3StaticWebsiteConstructProps) {
    super(scope, id);

    // Define construct contents here
    /* Website Bucket is the target bucket for the react application */
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
        bucketName: `${props.projectName}-website-bucket-${Math.floor(Math.random() * Math.floor(1000000))}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        websiteIndexDocument: props.websiteIndexDocument,
        websiteErrorDocument: props.websiteIndexDocument,
    });

    /* S3 Website Deployment */
    /* Seed the website bucket with the react source */
    const s3WebsiteDeploy = new s3deploy.BucketDeployment(this, 'S3WebsiteDeploy', {
        sources: [s3deploy.Source.asset('../assets')],
        destinationBucket:  websiteBucket
    });
    
    // Set website bucket allow policy
    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        resources: [
          `${websiteBucket.bucketArn}`
        ],
        actions: ["s3.Get*"],
        principals: [new iam.AnyPrincipal]
      })
    )

    const assetsCdn = new cf.CloudFrontWebDistribution(this, 'AssetsCdn', {
      defaultRootObject: props.cdnWebsiteIndexDocument,
      comment: `CDN for ${websiteBucket}`,
      originConfigs: [
          {
              s3OriginSource: {
                  s3BucketSource: websiteBucket,
                  // There is a current but in CDK by which OAE's create a circular dependency
                  // Amazon is aware of this.  The OAE is not required to run the demo app.
                  // originAccessIdentity: new cf.OriginAccessIdentity(this, 'WebsiteBucketOriginAccessIdentity', {
                  //     comment: `OriginAccessIdentity for ${websiteBucket}`
                  // }),
              },
              behaviors: [{ isDefaultBehavior: true }]
          }
      ]
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteBucketUrl', { value: websiteBucket.bucketWebsiteUrl })
    new cdk.CfnOutput(this, 'CdnUrl', { value: assetsCdn.distributionDomainName })
  }
}
