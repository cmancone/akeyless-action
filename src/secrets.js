const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

function getDynamicSecret(api, secretName, variableName, akeylessToken, exportSecretsToOutputs, exportSecretsToEnvironment) {
  return new Promise((resolve, reject) => {
    return api
      .getDynamicSecretValue(
        akeyless.GetDynamicSecretValue.constructFromObject({
          token: akeylessToken,
          name: secretName
        })
      )
      .then(dynamicSecret => {
        // Mask secret value in output
        core.setSecret(variableName, dynamicSecret);

        if (exportSecretsToOutputs) {
          core.setOutput(variableName, dynamicSecret);
        }

        if (exportSecretsToEnvironment) {
          let toEnvironment = dynamicSecret;
          if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
            toEnvironment = JSON.stringify(dynamicSecret);
          }
          core.exportVariable(variableName, toEnvironment);
          resolve({variableName: dynamicSecret});
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

function getStaticSecret(api, name, variableName, akeylessToken, exportSecretsToOutputs, exportSecretsToEnvironment) {
  return new Promise((resolve, reject) => {
    return api
      .getSecretValue(
        akeyless.GetSecretValue.constructFromObject({
          token: akeylessToken,
          names: [name]
        })
      )
      .then(staticSecret => {
        // Mask secret value in output
        const secretValue = staticSecret[name];
        core.setSecret(secretValue);

        if (exportSecretsToOutputs) {
          core.setOutput(variableName, secretValue);
        }

        if (exportSecretsToEnvironment) {
          core.exportVariable(variableName, secretValue);
        }
        resolve(variableName, secretValue);
      })
      .catch(error => {
        reject(error);
      });
  });
}

function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
  const api = akeylessApi.api(apiUrl);
  const toAwait = [];
  for (const [akeylessPath, variableName] of Object.entries(dynamicSecrets)) {
    toAwait.push(getDynamicSecret(api, akeylessPath, variableName, akeylessToken, exportSecretsToOutputs, exportSecretsToEnvironment));
  }
  return toAwait;
}

async function exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
  const api = akeylessApi.api(apiUrl);
  const toAwait = [];
  for (const [akeylessPath, variableName] of Object.entries(staticSecrets)) {
    toAwait.push(getStaticSecret(api, akeylessPath, variableName, akeylessToken, exportSecretsToOutputs, exportSecretsToEnvironment));
  }
  return toAwait;
}

exports.exportDynamicSecrets = exportDynamicSecrets;
exports.exportStaticSecrets = exportStaticSecrets;
