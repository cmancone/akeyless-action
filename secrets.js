const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

async function getDynamicSecret(api, name, akeylessToken) {
    const dynamicSecret = await api.getDynamicSecretValue(akeyless.GetDynamicSecretValue.constructFromObject({
        'token': akeylessToken,
        'name': name,
    }));
    return dynamicSecret;
}

async function getStaticSecret(api, name, akeylessToken) {
    const staticSecret = await api.getSecretValue(akeyless.GetSecretValue.constructFromObject({
        'token': akeylessToken,
        'names': [name],
    }));
    return staticSecret[name];
}

async function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
    api = akeylessApi.api(apiUrl);
    for (const [akeylessPath, variableName] of Object.entries(dynamicSecrets)) {
        const dynamicSecret = await getDynamicSecret(api, akeylessPath, akeylessToken);
        if (exportSecretsToOutputs) {
            core.setOutput(variableName, dynamicSecret);
        }
        if (exportSecretsToEnvironment) {
            let toEnvironment = dynamicSecret;
            if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
                toEnvironment = JSON.stringify(dynamicSecret);
            }
            core.exportVariable(variableName, toEnvironment);
        }
    }
}

async function exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
    api = akeylessApi.api(apiUrl);
    for (const [akeylessPath, variableName] of Object.entries(staticSecrets)) {
        const staticSecret = await getStaticSecret(api, akeylessPath, akeylessToken);
        if (exportSecretsToOutputs) {
            core.setOutput(variableName, staticSecret);
        }
        if (exportSecretsToEnvironment) {
            core.exportVariable(variableName, staticSecret);
        }
    }
}

exports.exportDynamicSecrets = exportDynamicSecrets;
exports.exportStaticSecrets = exportStaticSecrets;
