'use strict';

const AWS = require('aws-sdk');
const request = require('request-then');
const S3 = new AWS.S3({
    signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;
const ASSETS_URL = process.env.ASSETS_URL;
const CDN = process.env.CDN;

exports.handler = function (event, context, callback) {
    const key = event.queryStringParameters.key;
    const match = key.match(/((\d+)x(\d+))\/(.*)/);

    const width = parseInt(match[2], 10);
    const height = parseInt(match[3], 10);
    const originalKey = match[4];

    request({encoding: null, url: ASSETS_URL + '/' + originalKey})
        .then(data => Sharp(data.body)
            .resize(width, height)
            .toFormat('png')
            .toBuffer()
        )
        .then(buffer => S3.putObject({
                Body: buffer,
                Bucket: BUCKET,
                ContentType: 'image/png',
                Key: key,
                CacheControl: 'public, max-age=31536000',
            }).promise()
        )
        .then(() => callback(null, {
                statusCode: '301',
                headers: {'location': CDN + '/' + key},
                body: '',
            })
        )
        .catch(err => callback(err))
};
