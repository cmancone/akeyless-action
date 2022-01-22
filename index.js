const core = require('@actions/core');
const github = require('@actions/github');
const auth = require('./auth')
const awsAccess = require('./aws_access')
const secrets = require('./secrets')
const input = require('./input')

async function run() {
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
        if (staticSecrets) {
            secrets.exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment);
        }
        if (dynamicSecrets) {
            secrets.exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment);
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

exports.run = run

if (require.main === module) {
    run();
}
