const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless')
const akeylessCloudId = require('akeyless-cloud-id')

async function jwtLogin(apiUrl, accessId) {
    api = akeylessApi.api(apiUrl);
    try {
        const githubToken = await core.getIDToken();
        return api.auth(akeyless.Auth.constructFromObject({
            'access-type': 'jwt',
            'access-id': accessId,
            'jwt': githubToken,
        }));
    } catch (error) {
        core.setFailed(`Failed to fetch Github JWT: ${error.message}`);
    }
}
async function awsIamLogin(apiUrl, accessId) {
    api = akeylessApi.api(apiUrl);
    try {
        const cloudId = await akeylessCloudId();
    } catch (error) {
        core.setFailed(`Failed to fetch cloud id: ${error.message}`);
    }
    return api.auth(akeyless.Auth.constructFromObject({
        'access-type': 'aws_iam',
        'access-id': accessId,
        'cloud-id': cloudId,
    }));
}

const login = {
    'jwt': jwtLogin,
    'aws_iam': awsIamLogin,
}
const allowedAccessTypes = Object.keys(login);

async function akeylessLogin(accessId, accessType, apiUrl) {
    try {
        const result = await login[accessType](apiUrl, accessId)
        return result['token'];
    } catch (error) {
        core.setFailed(`AKeyless login failed: ${error.message}`);
    }
};

exports.akeylessLogin = akeylessLogin;
exports.allowedAccessTypes = allowedAccessTypes;
