const akeyless = require('akeyless')
var akeylessCloud = require('.')


const AkeylessClient = new akeyless.ApiClient();
AkeylessClient.basePath = 'https://api.akeyless.io';
const api = new akeyless.V2Api(AkeylessClient)


async function getSecret(key, opts) {
    try {
        const authResult = await api.auth(akeyless.Auth.constructFromObject(opts))
        const token = authResult.token

        const someObject = akeyless.GetSecretValue.constructFromObject({
            names: [key],
            token: token
        })
        const data = await api.getSecretValue(someObject)
        console.log('API called successfully. Returned data: ' + JSON.stringify(data))
        return JSON.stringify(data)
    } catch (e) {
        console.log(JSON.stringify(e, null, 2))
    }
}

const secret = akeylessCloud.getCloudId("aws_iam", "", (err, res) => {
    if (err) {
        console.log(err)
    } else {
        const optsAws = { 'access-id': "p-XXXXXX", 'access-type': "aws_iam", 'cloud-id': res }
        return getSecret("my-secret", optsAws)
    }
})


