

# AKeyless GitHub Action

This action will login to AKeyless using JWT or IAM authentication and then fetch secrets and/or provision AWS access via a dynamic producer.

1. [Inputs](#inputs)
2. [Outputs](#outputs)
3. [Job Permissions Requirement](#job-permissions-requirement)
3. [Required AKeyless Configuration](#akeyless-setup)
    1. [Authentication Methods](#authentication-methods)
    2. [Setting up JWT Auth](#setting-up-jwt-auth)
4. [Example Usage](#example-usage)
5. [Maintainer Statement](#maintainer-statement)

### Inputs

| Name | Required | Type | Value |
|------|----------|------|-------|
| access-id | Yes | string  | The access id for your auth method |
| access-type  | No | `string`  | The login method to use.  Must be `jwt` or `aws_iam`.  Defaults to `jwt` |
| api-url | No | `string`  | The API endpoint to use.  Defaults to `https://api.akeyless.io` |
| producer-for-aws-access | No | `string`  | Path to an AWS dynamic producer.  If provided, AWS credentials will be fetched from it and exported to the environment |
| static-secrets | No | `string` | A JSON object as a string, with a list of static secrets to fetch/export.  The key should be the path to the secret and the value should be the name of the environment variable/output to save it to. |
| dynamic-secrets | No | `string` | A JSON object as a string, with a list of dynamic secrets to fetch/export.  The key should be the path to the secret and the value should be the name of the environment variable/output to save it to. |
| export-secrets-to-outputs | No | `boolean` | True/False to denote if static/dynamic secrets should be exported as environment variables.  Defaults to `true` |
| export-secrets-to-environment | No | `boolean` | True/False to denote if static/dynamic secrets should be exported as action outputs.  Defaults to `true` |

### Outputs

The job outputs are determined by the values set in your `static-secrets` and `dynamic-secrets` inputs, as well as whether or not the `export-secrets-to-outputs` is set to true (which it is by default).

| Name | Value |
|------|-------|
| outputs | use `${{ steps.JOB_NAME.outputs.SECRET_NAME }}` |
| environment variables | use `${{ env.SECRET_NAME }}` |

### Job Permissions Requirement

The default usage relies on using the GitHub JWT to login to AKeyless.  To make this available, you have to configure it in your job workflow:

```
jobs:
  my_job:
    #---------Required---------#
    permissions: 
      id-token: write
      contents: read
    #--------------------------#
```
> If this is not present, the akeyless-action step will fail with the following error `Failed to login to AKeyless: Error: Failed to fetch Github JWT: Error message: Unable to get ACTIONS\_ID\_TOKEN\_REQUEST\_URL env variable`

## AKeyless Setup

### Authentication Methods

This action only supports authenticating to AKeyless via JWT auth (using the GitHub OIDC token) or via IAM Auth (using a role attached to a cloud-hosted GitHub runner).  I don't plan to support additional authentication methods because there isn't much point (with the possible exception of Universal Identity).  After all, any runner can login to AKeyless using OIDC without storing permanent access credentials.  IAM auth is also supported in case you are using a runner hosted in your cloud account and so are already using IAM auth anyway - this will also give your runner access to AKeyless without storing permanent access credentials.

### Setting up JWT Auth

To configure AKeyless and grant your repositories the necessary permissions to execute this action:

1. Create a GitHub JWT Auth method in AKeyless if you don't have one (you can safely share the auth method between repositories)
    1. In AKeyless go to "Auth Methods" -> "+ New" -> "OAuth 2.0/JWT".
    2. Specify a name (e.g. "GitHub JWT Auth") and location of your choice.
    3. For the JWKS Url, specify `https://token.actions.githubusercontent.com/.well-known/jwks`
    4. For the unique identifier use `repository`. See note (1) below for more details.
    5. You **MUST** click "Require Sub Claim on role association".  This will prevent you from attaching this to a role without any additional checks. If you accidentally forgot to set subclaim checks, then any GitHub runner owned by *anyone* would be able to authenticate to AKeyless and access your resources... **that make this a critical checkbox**.  See the [GitHub docs](https://docs.GitHub.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud) for more details.
2. Create an appropriate access role (if you don't already have one)
    1. In AKeyless go to "Access Roles" -> "+ New"
    2. Give it a name and location, and create it.
    3. Find your new access role and click on it to edit it.
    4. On the right side, under "Secrets & Keys", click the "Add" button to configure read access to any static or dynamic secrets you will fetch from your pipeline.
3. Attach your GitHub JWT Auth method to your role
    1. Once again, find the access role you created in step #2 above and click on it to edit it.
    2. Hit the "+ Associate" button to associate your "GitHub JWT Auth" method with the role.
    3. In the list, find the auth method you created in Step #1 above.
    4. Add an appropriate sub claim, based on [the claims available in the JWT](https://docs.GitHub.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token). See note (2) below for more details.
    5. Save!

After following these steps, you'll be ready to use JWT Auth from your GitHub runners!

**(1) Note:** The unique identifier is mainly used for auditing/billing purposes, so there isn't one correct answer here.  `repository` is a sensible default but if you are uncertain, talk to AKeyless for more details.

**(2) Note:** Subclaim checks allow AKeyless to grant access to specific workflows, based on the claims that GitHub provides in the JWT.  Using the example JWT from [the documentation](https://docs.GitHub.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token), you could set a subclaim check in AKeyless of:

```
repository=octo-org/octo-repo
ref=refs/heads/main
```

to limit access to workflows that were triggered from the main branch in the `octo-org/octo-repo` repository.

## Example

```
jobs:
  fetch_secrets:
    runs-on: ubuntu-latest
    permissions:  # IMPORTANT - both of these are required
      id-token: write
      contents: read
    name: Fetch some static secrets
    steps:
    - name: Fetch secrets from AKeyless
      id: fetch-secrets
      uses: LanceMcCarthy/akeyless-action@v2
      with:
        access-id: auth-method-access-id     # (ex: 'p-iwt13fd19ajd') We recommend storing this as a GitHub Actions secret
        static-secrets: '{"/path/to/static/secret":"my_first_secret","/path/to/another/secret":"my_second_secret"}'
        dynamic-secrets: '{"/path/to/dynamic/secret":"my_dynamic_secret"}'
        export-secrets-to-outputs: true      # default = true
        export-secrets-to-environment: true  # default = true
        
    - name: Use Outputs
      run: |
        echo "Step Outputs"
        echo "my_first_secret: ${{ steps.fetch-secrets.outputs.my_first_secret }}"
        echo "my_second_secret: ${{ steps.fetch-secrets.outputs.my_second_secret }}"
        echo "my_dynamic_secret: ${{ steps.fetch-secrets.outputs.my_dynamic_secret }}"
        
        echo "Environment Variables"
        echo "my_first_secret: ${{ env.my_first_secret }}"
        echo "my_second_secret: ${{ env.my_second_secret }}"
        echo "my_dynamic_secret: ${{ env.my_dynamic_secret }}"
```

> Live demo: You can see this used in this Action's CI validation workflow at [workflows/ci.yml](https://github.com/LanceMcCarthy/akeyless-action/blob/main/.github/workflows/ci.yml)

### Maintainer Statement

Although this fork is primarily for publishing the Action to GitHub Marketplace, any new features or fixes will be synced with [the upstream repository](https://github.com/cmancone/akeyless-action) to ensure ongoing maintenance coordination.