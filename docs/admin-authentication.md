# Single administrator setup and recovery

## Designation

Set `ARCHIVE_ADMIN_EMAIL` to the exact email of the existing administrator account in the deployment environment. Do this before enabling the new login route. The account's database ID and all content/revision references are preserved. The setting must remain stable after initialization; an email mismatch intentionally prevents administrator access.

## Initialize or recover

Run the command from a trusted deployment shell after setting the environment variable:

```sh
php artisan make:admin --name="Archive administrator"
```

The command prompts for a password twice without echoing it, requires at least 12 characters, hashes it with Laravel's configured password hasher, and updates the row matching `ARCHIVE_ADMIN_EMAIL` instead of creating a duplicate. It reactivates a soft-deleted matching account and revokes that account's Sanctum tokens. It does not print the password. Never add the password to command arguments, environment files, logs, or shell history.

Then open `/admin/login` over HTTPS. Login is rate-limited. Laravel sessions regenerate after authentication; production session cookies must be Secure, HttpOnly, and SameSite=Lax. First-party API writes use the session cookie and CSRF token.

## Account controls

There is no public registration or Google sign-in endpoint. Application user creation and invitations can create editorial roles only; neither interface can grant administrator roles. The production database seeder creates role definitions but no user accounts. The protected `make:admin` CLI command is the only supported administrator creation or recovery path. Existing legacy admin-role rows are preserved but only the configured email is authorized as an administrator.

Configure `SANCTUM_STATEFUL_DOMAINS` with the actual app host (and port for local development). The admin site and API should share an origin. Keep `APP_DEBUG=false` and use HTTPS in production.
