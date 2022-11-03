const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

async function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
  const api = akeylessApi.api(apiUrl);

  for (const [akeylessPath, variableName] of Object.entries(dynamicSecrets)) {
    try {
      let param = akeyless.GetDynamicSecretValue.constructFromObject({
        token: akeylessToken,
        name: akeylessPath
      });

      let dynamicSecret = await api.getDynamicSecretValue(param).catch(error => {
        core.error(`getDynamicSecretValue Failed: ${error}`);
        core.setFailed(`getDynamicSecretValue Failed: ${error}`);
      });

      if (dynamicSecret === undefined) {
        return;
      }

      // Mask secret value in output
      core.setSecret(variableName, dynamicSecret);

      // switch 1
      if (exportSecretsToOutputs) {
        core.setOutput(variableName, dynamicSecret);
      }

      // switch 2
      if (exportSecretsToEnvironment) {
        let toEnvironment = dynamicSecret;
          if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
            toEnvironment = JSON.stringify(dynamicSecret);
          }
          core.exportVariable(variableName, toEnvironment);
      }

    } catch (error) {
      //core.error(`Failed to export dynamic secrets: ${error}`);
      core.setFailed(`Failed to export dynamic secrets: ${error}`);
    }
  }
}

async function exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
  const api = akeylessApi.api(apiUrl);

  for (const [akeylessPath, variableName] of Object.entries(staticSecrets)) {
    let name = akeylessPath;

    let param = akeyless.GetSecretValue.constructFromObject({
      token: akeylessToken,
      names: [name]
    });

    let staticSecret = await api.getSecretValue(param).catch(error => {
      core.error(`getSecretValue Failed: ${error}`);
      core.setFailed(`getSecretValue Failed: ${error}`);
    });

    if (staticSecret === undefined) {
      return;
    }

    const secretValue = staticSecret[name];

    core.setSecret(secretValue);

    // switch 1
    if (exportSecretsToOutputs) {
      core.setOutput(variableName, secretValue);
    }

    // switch 2
    if (exportSecretsToEnvironment) {
      core.exportVariable(variableName, secretValue);
    }
  }
}

exports.exportDynamicSecrets = exportDynamicSecrets;
exports.exportStaticSecrets = exportStaticSecrets;
