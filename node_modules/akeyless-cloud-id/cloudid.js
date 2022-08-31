
const AWS = require('aws-sdk')
const aws4 = require('aws4')
const axios = require('axios')
const { GoogleAuth } = require('google-auth-library');
const { IAMCredentialsClient } = require('@google-cloud/iam-credentials');


function getCloudId(acc_type, param, callback) {
    if (acc_type === "aws_iam") {
        getAWsCloudId(callback)
    } else if (acc_type === "azure_ad") {
        getAzureCloudID(param, callback)
    } else if (acc_type === "gcp") {
        getGcpCloudID(param, callback)
    } else if (acc_type === "access_key") {
        callback(undefined, "")
    } else {
        callback(new Error("Invalid access type"), undefined);
    }
}

//callback(err, res)
function getAzureCloudID(object_id, callback) {

    const headers = { 'user-agent': 'AKEYLESS', 'Metadata': 'true' }
    const params = { 'api-version': '2018-02-01', 'resource': 'https://management.azure.com/', 'object_id': object_id }

    axios.get('http://169.254.169.254/metadata/identity/oauth2/token', { params, headers }).then(res => {
        callback(undefined, Buffer.from(res.data.access_token).toString('base64'));
    }).catch(err => callback(err, undefined));
}


//callback(err, res)
async function getGcpCloudID(audience, callback) {
    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    try {
        const crd = await auth.getApplicationDefault()
        const minute = 60 * 1000;
        const expiresAt = (Date.now() + minute * 10) / 1000;

        if (crd.credential.key && crd.credential.email) {
            const iamclient = new IAMCredentialsClient();
            const Payload = { 'aud': 'akeyless.io', 'exp': Math.round(expiresAt), 'sub': crd.credential.email }
            const token = await iamclient.signJwt({
                name: `projects/-/serviceAccounts/${crd.credential.email}`,
                payload: JSON.stringify(Payload),
            });
            const res = Buffer.from(token[0].signedJwt).toString('base64')
            callback(undefined, res)

        } else {
            const oAuth2Client = await auth.getIdTokenClient(audience);
            const clientHeaders = await oAuth2Client.getRequestHeaders();
            const token = clientHeaders['Authorization'];
            const res = Buffer.from(token.slice(7)).toString('base64')
            callback(undefined, res)
        }

    } catch (e) {
        callback(e, undefined);
    }
}

//callback(err, res)
function getAWsCloudId(callback) {
    AWS.config.getCredentials(function (err) {
        if (err) {
            callback(err, undefined);
        } else {
            const result = stsGetCallerIdentity(AWS.config.credentials)
            callback(undefined, result);
        }
    });
}

function stsGetCallerIdentity(creds) {

    const opts3 = { method: 'POST', service: 'sts', body: 'Action=GetCallerIdentity&Version=2011-06-15', region: 'us-east-1' }
    opts3.headers = {
        "Content-Length": opts3.body.length,
        "Content-Type": 'application/x-www-form-urlencoded; charset=utf-8',
    }
    aws4.sign(opts3, creds)

    const h = {
        'Authorization': [opts3.headers['Authorization']],
        'Content-Length': [opts3.body.length.toString()],
        'Host': [opts3.headers['Host']],
        'Content-Type': [opts3.headers['Content-Type']],
        'X-Amz-Date': [opts3.headers['X-Amz-Date']],
    }
    if (creds.sessionToken) {
        h['X-Amz-Security-Token'] = [creds.sessionToken];
    }
    const myheaders = JSON.stringify(h);

    const obj = {
        'sts_request_method': 'POST',
        'sts_request_url': Buffer.from('https://sts.amazonaws.com/').toString('base64'),
        'sts_request_body': Buffer.from('Action=GetCallerIdentity&Version=2011-06-15').toString('base64'),
        'sts_request_headers': Buffer.from(myheaders).toString('base64')
    };
    const awsData = JSON.stringify(obj)
    return Buffer.from(awsData).toString('base64')
}


module.exports = {
    getAWsCloudId: getAWsCloudId,
    getAzureCloudID: getAzureCloudID,
    getGcpCloudID: getGcpCloudID,
    getCloudId: getCloudId,
}
