import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');
import s3deploy = require('@aws-cdk/aws-s3-deployment');
import cf = require('@aws-cdk/aws-cloudfront');

export interface CdkS3StaticWebsiteConstructProps extends cdk.StackProps {
  projectName: string,
  s3WebsiteDeploySource?: string,
  websiteIndexDocument: string,
  websiteErrorDocument: string,
  cdnWebsiteIndexDocument: string,
  cdnComment: string,
  useCdn: boolean
}

export class CdkS3StaticWebsiteConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: CdkS3StaticWebsiteConstructProps) {
    if (props.projectName.length > 12) {
      throw new Error('Project name must be less than 13 characters');
    }
    if(!props.projectName.match("^[a-zA-Z0-9]*$")){
      throw new Error('Project name must not contain special characters');
   }
    super(scope, id);
  
    /* Website Bucket is the target bucket for the react application */
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `${props.projectName}-website-bucket-${Math.floor(Math.random() * Math.floor(1000000))}`.toLowerCase(),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: props.websiteIndexDocument,
      websiteErrorDocument: props.websiteIndexDocument,
    });

    /* S3 Website Deployment */
    /* Seed the website bucket with the, only if the folder exists */
    if (props.s3WebsiteDeploySource) {
      const s3WebsiteDeploy = new s3deploy.BucketDeployment(this, 'S3WebsiteDeploy', {
        sources: [s3deploy.Source.asset(props.s3WebsiteDeploySource)],
        destinationBucket: websiteBucket
      });
    }

    /* Set Website Bucket Allow Policy */
    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        resources: [
          `${websiteBucket.bucketArn}/*`
        ],
        actions: ["s3:Get*"],
        principals: [new iam.AnyPrincipal]
      })
    );

    new cdk.CfnOutput(this, 'WebsiteBucketUrl', { value: websiteBucket.bucketWebsiteUrl });


    /* Cloudfront CDN Distribution */
    //#region 
    if (props.useCdn) {
      const assetsCdn = new cf.CloudFrontWebDistribution(this, 'AssetsCdn', {
        defaultRootObject: props.cdnWebsiteIndexDocument,
        comment: props.cdnComment,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: websiteBucket,
            },
            behaviors: [{ isDefaultBehavior: true }]
          }
        ]
      });
      new cdk.CfnOutput(this, 'CdnUrl', { value: assetsCdn.distributionDomainName });
    }
    //#endregion

  }
}