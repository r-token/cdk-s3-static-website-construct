import { Stack } from '@aws-cdk/core'
import { expect as expectCDK, haveResource, countResources, SynthUtils } from '@aws-cdk/assert'
import '@aws-cdk/assert/jest'

import * as s3website from '../lib/index'

// Snapshot Tests
// Commenting snapshot test out because we're dynamically naming our S3 buckets, so it will never match the previous snapshot and fail every time

// test('a website bucket is successfully created', () => {
//     // GIVEN
//     const stack = new Stack()

//     // WHEN
//     new s3website.S3StaticWebsiteConstruct(stack, 's3website', {
//         projectName: 'projname',
//         websiteIndexDocument: 'index.html',
//         websiteErrorDocument: 'index.html',
//         cdnComment: 'CDN for static website app',
//         cdnWebsiteIndexDocument: 'index.html',
//         useCdn: false
//     })

//     // THEN
//     expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot()
// })

// Fine-grained Tests
// Tests whether the construct successfully creates a website bucket
test('s3website creates a website bucket', () => {
    // GIVEN
    const stack = new Stack()

    // WHEN
    new s3website.S3StaticWebsiteConstruct(stack, 's3website', {
        projectName: 'pname',
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'index.html',
        cdnComment: 'CDN for static website app',
        cdnWebsiteIndexDocument: 'index.html',
        useCdn: false
    })

    // THEN
    // Counts whether there is exactly one AWS S3 bucket created as a result
    expectCDK(stack).to(countResources('AWS::S3::Bucket', 1))

    // from @aws-cdk/assert/jest
    // expect(stack).toHaveResource('AWS::S3::Bucket)

    // from @aws-cdk/assert
    expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
        WebsiteConfiguration: {
            ErrorDocument: 'index.html',
            IndexDocument: 'index.html'
        }
    }))
})

// Validation Tests
test('project name is less than 13 characters', () => {
    // GIVEN
    const stack = new Stack()

    // WHEN

    // THEN
    expect(() => {
        new s3website.S3StaticWebsiteConstruct(stack, 's3website', {
            projectName: '12345678987654321',
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            cdnComment: 'CDN for static website app',
            cdnWebsiteIndexDocument: 'index.html',
            useCdn: false
        })
    }).toThrowError(/Project name must be less than 13 characters/)
})

test ('project name contains special characters', () => {
    // GIVEN
    const stack = new Stack()

    // WHEN

    // THEN
    expect(() => {
        new s3website.S3StaticWebsiteConstruct(stack, 's3website', {
            projectName: '%@#$%@^',
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            cdnComment: 'CDN for static website app',
            cdnWebsiteIndexDocument: 'index.html',
            useCdn: false
        })
    }).toThrowError(/Project name must not contain special characters/)
})