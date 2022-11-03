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

      if(dynamicSecret === undefined) {
        return;
      }

      // Mask secret value in output
      core.setSecret(variableName, dynamicSecret);

      if (exportSecretsToOutputs) {
        core.setOutput(variableName, dynamicSecret);
      }

      if (exportSecretsToEnvironment) {
        try {
          let toEnvironment = dynamicSecret;
          if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
            toEnvironment = JSON.stringify(dynamicSecret);
          }
          core.exportVariable(variableName, toEnvironment);
        } catch (error) {
          core.error(`exportSecretsToEnvironment Failed: ${error}`);
        }

        //resolve({variableName: dynamicSecret});
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
    try {
      await getStaticSecret(api, akeylessPath, variableName, akeylessToken, exportSecretsToOutputs, exportSecretsToEnvironment);
    } catch (error) {
      core.error(`Failed to export static secrets: ${error}`);
      core.setFailed(`Failed to export static secrets: ${error}`);
    }
  }
}

exports.exportDynamicSecrets = exportDynamicSecrets;
exports.exportStaticSecrets = exportStaticSecrets;
