# Security policy

## Reporting a problem

Do not open a public issue for vulnerabilities, exposed credentials, account-access problems, or private user data. Report them privately to the repository owner.

## Sensitive information

The following must never be committed:

- Environment files and deployment secrets
- Passwords and recovery codes
- Authentication cookies or tokens
- User workspace exports
- Private calendar links
- Production database contents

If a credential is exposed, revoke or rotate it immediately, remove it from the deployment environment, and review the repository history before restoring service.

## Supported version

Until V1 is released, security fixes apply only to the latest commit on `main`.

