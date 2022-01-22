const core = require('@actions/core');
const github = require('@actions/github');
const auth = require('./auth')
const awsAccess = require('./aws_access')
const secrets = require('./secrets')
const input = require('./input')

async function run() {
    try {
        core.debug('Fetching input');
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
        core.debug(`access id: ${accessId}`);

        core.debug(`Fetch akeyless token`);
        const akeylessToken = auth.akeylessLogin(accessId, accessType, apiUrl);
        core.debug(`Producer for AWS Access: ${producerForAwsAccess}`);
        if (producerForAwsAccess) {
            core.debug(`Fetch AWS credentials`);
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
