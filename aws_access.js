const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

async function awsLogin(akeylessToken, producerForAwsAccess, apiUrl) {
    api = akeylessApi.api(apiUrl);
    const awsCredentials = await api.getDynamicSecretValue(akeyless.GetDynamicSecretValue.constructFromObject({
        'token': akeylessToken,
        'name': producerForAwsAccess,
    }));

    const accessKeyId = awsCredentials['access_key_id'];
    const secretAccessKey = awsCredentials['secret_access_key'];
    const sessionToken = awsCredentials['session_token'];

    core.setSecret(accessKeyId);
    core.exportVariable('AWS_ACCESS_KEY_ID', accessKeyId);
    core.setSecret(secretAccessKey);
    core.exportVariable('AWS_SECRET_ACCESS_KEY', secretAccessKey);
    if (sessionToken) {
        core.setSecret(sessionToken);
        core.exportVariable('AWS_SESSION_TOKEN', sessionToken);
    }
}

exports.awsLogin = awsLogin;
