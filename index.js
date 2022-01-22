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
        core.debug(`Fetch akeyless token with access type ${accessType}`);
        const akeylessToken = auth.akeylessLogin(accessId, accessType, apiUrl);
        core.debug(`AKeyless token length: ${akeylessToken.length}`);
        if (producerForAwsAccess) {
            core.debug(`Fetch AWS credentials with producer ${producerForAwsAccess}`);
            awsAccess.awsLogin(akeylessToken, producerForAwsAccess, apiUrl);
        } else {
            core.debug(`No AWS producer specified: skipping AWS access step`);
        }
        if (staticSecrets) {
            core.debug(`Fetch static secrets`);
            secrets.exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment);
        } else {
            core.debug(`No static secrets specified: skipping static secret export step`);
        }
        if (dynamicSecrets) {
            core.debug(`Fetch dynamic secrets`);
            secrets.exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment);
        } else {
            core.debug(`No dynamic secrets specified: skipping dynamic secret export step`);
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

exports.run = run

if (require.main === module) {
    try {
        core.debug('Starting main run');
        run();
    } catch (error) {
        core.setFailed(error.message);
    }
}
