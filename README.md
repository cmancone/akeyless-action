# AKeyless Github Action

This action will login to AKeyless using JWT or IAM auth and then fetch secrets and/or provision AWS access via a dynamic producer.

## Authentication Methods

This action only supports authenticating to AKeyless via JWT auth (using the Github OIDC token) or via IAM Auth (using a role attached to a cloud-hosted Github runner).  I don't plan to support additional authentication methods because there isn't much point.  Any other authentication method (with the exception of [universal identity](https://docs.akeyless.io/docs/universal-identity)) would requiring storing access tokens in Github.  Since JWT auth already has 100% coverage of all Github runners **and** allows easy access to AKeyless without storing permanent access credentials, there's no good reason to copy permanent access credentials into Github.

## Setting up JWT Auth

To configure AKeyless and grant your repositories the necessary permissions to execute this action:

 1. Create a Github JWT Auth method in AKeyless if you don't have one (you can safely share the auth method between repositories)
   1. In AKeyless go to "Auth Methods" -> "+ New" -> "OAuth 2.0/JWT".
   2. Specify a name and location of your choice.
   3. For the JWKS Url, specify `https://token.actions.githubusercontent.com/.well-known/jwks`
   4. For the unique identifier use `repository` (1)
   5. You **MUST** click "Require Sub Claim on role association".  This will prevent you from attaching this to a role without any additional checks, and if you were to do that, any github runner owned by *anyone* would be able to authenticate to AKeyless as you.  See the [github docs](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud) for more details.
 2. Attach

(1) **Note:** the unique identifier is mainly used for auditing/billing purposes, so the exact choice is up to you.  `repository` is a sensible default but if you are uncertain, talk to AKeyless support for more details.
