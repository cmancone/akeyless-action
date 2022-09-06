const core = require('@actions/core');
const github = require('@actions/github');
const auth = require('./auth');
const awsAccess = require('./aws_access');
const secrets = require('./secrets');
const input = require('./input');

async function run() {
  core.debug('Fetching input');
  const {accessId, accessType, apiUrl, producerForAwsAccess, staticSecrets, dynamicSecrets, exportSecretsToOutputs, exportSecretsToEnvironment} = input.fetchAndValidateInput();
  core.debug(`access id: ${accessId}`);
  core.debug(`Fetch akeyless token with access type ${accessType}`);

  let akeylessToken;
  try {
    akeylessLoginResponse = await auth.akeylessLogin(accessId, accessType, apiUrl);
    akeylessToken = akeylessLoginResponse['token'];
  } catch (error) {
    core.error(`Failed to login to AKeyless: ${error}`);
    core.setFailed(`Failed to login to AKeyless: ${error}`);
    return;
  }

  core.debug(`AKeyless token length: ${akeylessToken.length}`);

  // Logging into AWS and fetching secrets can all run at the same time,
  // and we don't need to do anything with the response from them.  Therefore, collect
  // their promises and then just await for all of them.
  const toAwait = [];

  // AWS Access
  if (producerForAwsAccess) {
    core.debug(`AWS Access: Fetching credentials with producer ${producerForAwsAccess}`);
    toAwait.push(awsAccess.awsLogin(akeylessToken, producerForAwsAccess, apiUrl));
  } else {
    core.debug(`AWS Access: Skipping because no AWS producer is specified`);
  }

  // static secrets
  if (staticSecrets) {
    core.debug(`Static Secrets: Fetching!`);
    toAwait.push(secrets.exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment));
  } else {
    core.debug(`Static Secrets: Skpping step because no static secrets were specified`);
  }

  // dynamic secrets
  if (dynamicSecrets) {
    core.debug(`Dynamic Secrets: Fetching!`);
    toAwait.push(secrets.exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment));
  } else {
    core.debug(`Dynamic Secrets: Skipping step because no dynamic secrets were specified`);
  }
}

exports.run = run;

if (require.main === module) {
  try {
    core.debug('Starting main run');
    run();
  } catch (error) {
    core.debug(error.stack);
    core.setFailed(error.message);
    core.debug(error.message);
  }
}
