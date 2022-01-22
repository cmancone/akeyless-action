const core = require('@actions/core');
const github = require('@actions/github');
const auth = require('./auth')
const awsAccess = require('./aws_access')
const secrets = require('./secrets')
const input = require('./input')

try {
    const {
        accessId,
        accessType,
        apiUrl,
        producerForAwsAccess,
        staticSecrets,
        dynamicSecrets,
        exportSecretsToOutputs,
        exportSecretsToEnvironment,
    } = input.fetchAndValidateInput();

    const akeylessToken = auth.akeylessLogin(accessId, accessType, apiUrl);
    if (producerForAwsAccess) {
        awsAccess.awsLogin(akeylessToken, producerForAwsAccess, apiUrl);
    }

} catch (error) {
    core.setFailed(error.message);
}
