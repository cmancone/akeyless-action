const core = require('@actions/core');
const assert = require('assert')

const fetchAndValidateInput = () => {
    const params = {
        accessId: core.getInput('access-id'),
        accessType: core.getInput('access-type'),
        apiUrl: core.getInput('api-url'),
        producerForAwsAccess: core.getInput('producer-for-aws-access'),
        staticSecrets: core.getInput('static-secrets'),
        dynamicSecrets: core.getInput('dynamic-secrets'),
        exportSecretsToOutputs: core.getInput('export-secrets-to-outputs'),
        exportSecretsToEnvironment: core.getInput('export-secrets-to-environment'),
    }
    assert(params['accessId'], 'You must provide the access id for your auth method via the access-id input')
    return {
    }
}

exports.fetchAndValidateInput = fetchAndValidateInput
