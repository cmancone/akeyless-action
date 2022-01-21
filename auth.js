const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless')
const akeylessCloudId = require('akeyless-cloud-id')

async function jwtLogin(apiUrl, accessId) {
    api = akeylessApi.api(apiUrl);
    const githubToken = await core.getIDToken();
    return api.auth(akeyless.Auth.constructFromObject({
        'access-type': 'jwt',
        'access-id': accessId,
        'jwt': githubToken,
    }))
}
async function awsIamLogin(apiUrl, accessId) {
    api = akeylessApi.api(apiUrl);
    const cloudId = await akeylessCloudId();
    return api.auth(akeyless.Auth.constructFromObject({
        'access-type': 'aws_iam',
        'access-id': accessId,
        'cloud-id': cloudId,
    }))
}

const login = {
    'jwt': jwtLogin,
    'aws_iam': awsIamLogin,
}
const allowedAccessTypes = Object.keys(login)

async function akeylessLogin(accessId, accessType, apiUrl) {
    const result = await login[accessType](apiUrl, accessId)
    return result['token'];
};

exports.akeylessLogin = akeylessLogin;
exports.allowedAccessTypes = allowedAccessTypes;
exports.jwtLogin = jwtLogin;
