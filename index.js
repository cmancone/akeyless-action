const core = require('@actions/core');
const github = require('@actions/github');
const auth = require('./auth')
const aws_access = require('./aws_access')
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
    } = input.fetchAndValidateInput()

} catch (error) {
    core.setFailed(error.message);
}
