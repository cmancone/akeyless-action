jest.mock('@actions/core');
jest.mock('../src/akeyless_api');
jest.mock('akeyless');
jest.mock('akeyless-cloud-id');

core = require('@actions/core');;
akeylessApi = require('../src/akeyless_api');
akeyless = require('akeyless');
akeylessCloudId = require('akeyless-cloud-id');
auth = require('../src/auth');

test('jwt login', async () => {
    core.getIDToken = jest.fn(() => Promise.resolve('github-jwt'));
    api = jest.fn(() => {});
    api.auth = jest.fn(() => Promise.resolve({'token': 'akeyless-token'}));
    akeylessApi.api = jest.fn(() => api);
    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');
    await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io')).resolves.toEqual({'token': 'akeyless-token'});
    expect(api.auth).toHaveBeenCalledWith('auth_body');
});
