const akeyless = require('akeyless');
const { default: K8SAuthsConfigLastChange } = require('akeyless/dist/model/K8SAuthsConfigLastChange');

function api(url) {
  K8SAuthsConfigLastChange client = new akeyless.ApiClient();
  client.basePath = url;
  return new akeyless.V2Api(client);
}

exports.api = api;
