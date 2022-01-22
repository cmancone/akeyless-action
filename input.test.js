jest.mock('@actions/core');

core = require('@actions/core');
input = require('./input')

test('Input is all good', () => {
    core.getInput = jest.fn()
    core.getInput.mockReturnValueOnce('p-asdf')
    core.getInput.mockReturnValueOnce('JWT')
    core.getInput.mockReturnValueOnce('https://api.akeyless.io')
    core.getInput.mockReturnValueOnce('/path/to/aws/producer')
    core.getInput.mockReturnValueOnce('{"/some/static/secret":"secret_key"}')
    core.getInput.mockReturnValueOnce('{"/some/dynamic/secret":"other_key"}')
    core.getInput.mockReturnValueOnce(true)
    core.getInput.mockReturnValueOnce(true)
    params = input.fetchAndValidateInput()
    expect(params).toEqual({
        'accessId': 'p-asdf',
        'accessType': 'jwt',
        'apiUrl': 'https://api.akeyless.io',
        'producerForAwsAccess': '/path/to/aws/producer',
        'staticSecrets': {'/some/static/secret': 'secret_key'},
        'dynamicSecrets': {'/some/dynamic/secret': 'other_key'},
        'exportSecretsToOutputs': true,
        'exportSecretsToEnvironment': true,
    })
    expect(core.getInput.mock.calls).toEqual([
        ['access-id'],
        ['access-type'],
        ['api-url'],
        ['producer-for-aws-access'],
        ['static-secrets'],
        ['dynamic-secrets'],
        ['export-secrets-to-outputs'],
        ['export-secrets-to-environment'],
    ]);
});

test('check string', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce(343);
    core.getInput.mockReturnValue('sup');
    expect(() => {input.fetchAndValidateInput()}).toThrow("Input 'access-type' should be a string");
})

test('invalid access type', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('asdf');
    core.getInput.mockReturnValueOnce('https://api.akeyless.io');
    core.getInput.mockReturnValueOnce('/path/to/aws/producer');
    core.getInput.mockReturnValueOnce('{"/some/static/secret":"secret_key"}');
    core.getInput.mockReturnValueOnce('{"/some/dynamic/secret":"other_key"}');
    core.getInput.mockReturnValueOnce(true);
    core.getInput.mockReturnValueOnce(true);
    expect(() => {input.fetchAndValidateInput()}).toThrow("access-type must be one of: ['jwt', 'aws_iam']");
})
