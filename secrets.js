const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

function getDynamicSecret(api, name, variableName, akeylessToken, exportSecretsToOutputs, exportSecretsToEnvironment) {
    return new Promise((resolve, reject) => {
        return api.getDynamicSecretValue(akeyless.GetDynamicSecretValue.constructFromObject({
            'token': akeylessToken,
            'name': name,
        })).then(dynamicSecret => {
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
        }).catch(error => {
            reject(error);
        });
    });
}

function getStaticSecret(api, name, variableName, akeylessToken, exportSecretsToOutputs, exportSecretsToEnvironment) {
    return new Promise((resolve, reject) => {
        return api.getSecretValue(akeyless.GetSecretValue.constructFromObject({
            'token': akeylessToken,
            'names': [name],
        })).then(staticSecret => {
            if (exportSecretsToOutputs) {
                core.setOutput(variableName, staticSecret[name]);
            }
            if (exportSecretsToEnvironment) {
                core.exportVariable(variableName, staticSecret[name]);
            }
            resolve(variableName, staticSecret[name]);
        }).catch(error => {
            reject(error);
        });
    });
}

function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
    const api = akeylessApi.api(apiUrl);
    let toAwait = []
    for (const [akeylessPath, variableName] of Object.entries(dynamicSecrets)) {
        toAwait.push(getDynamicSecret(
            api,
            akeylessPath,
            variableName,
            akeylessToken,
            exportSecretsToOutputs,
            exportSecretsToEnvironment
        ));
    }
    return toAwait;
}

async function exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
    const api = akeylessApi.api(apiUrl);
    let toAwait = []
    for (const [akeylessPath, variableName] of Object.entries(staticSecrets)) {
        let promise = getStaticSecret(
            api,
            akeylessPath,
            variableName,
            akeylessToken,
            exportSecretsToOutputs,
            exportSecretsToEnvironment,
        );
        core.debug('pushing to list:');
        core.debug(promise);
        toAwait.push(promise);
    }
    core.debug('list:');
    core.debug(toAwait);
    return toAwait;
}

exports.exportDynamicSecrets = exportDynamicSecrets;
exports.exportStaticSecrets = exportStaticSecrets;
