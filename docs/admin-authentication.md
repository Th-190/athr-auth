# Super Admin setup and recovery

## Designation

Set `ARCHIVE_ADMIN_EMAIL` to the exact email for the bootstrap/recovery Super Admin. It is used only by the protected CLI initializer; it is not an allowlist for normal Super Admin login. All three Super Admins authenticate independently by their own email and password. Existing user IDs and content/revision references are preserved when the matching account is promoted by the initializer.

## Initialize or recover

Run the command from a trusted deployment shell after setting the environment variable:

```sh
php artisan make:admin --name="Archive administrator"
```

The command prompts for a password twice without echoing it, requires at least 12 characters, hashes it with Laravel's configured password hasher, and updates the row matching `ARCHIVE_ADMIN_EMAIL` instead of creating a duplicate. It promotes that identity to `super_admin`, reactivates a soft-deleted matching account, and revokes that account's Sanctum tokens. It refuses to exceed three active Super Admins. It does not print the password. Never add the password to command arguments, environment files, logs, or shell history.

Then open `/admin/login` over HTTPS. Login is rate-limited. Laravel sessions regenerate after authentication; production session cookies must be Secure, HttpOnly, and SameSite=Lax. First-party API writes use the session cookie and CSRF token.

## Account controls

There is no public registration or Google sign-in endpoint. The active-account limit is three `super_admin` users; inactive and soft-deleted historical accounts do not consume a slot. Only an active Super Admin can create, activate, deactivate, promote, demote, or remove another Super Admin through the protected administration API. The server serializes account-limit changes using the Super Admin role row lock and refuses to disable or remove the last usable active Super Admin. The regular user API cannot grant the legacy `admin` role. Invitations remain restricted to non-administrative editorial roles. The protected `make:admin` CLI command initializes or recovers the bootstrap Super Admin. The database seeder creates role definitions only.

After the first account is initialized, a Super Admin signs in at `/admin/login`, opens Users, and creates two more accounts with unique emails and passwords of at least 12 characters. Enable two-factor authentication for each account before using protected administration routes in production. Keep disabled or soft-deleted accounts as historical records; only active Super Admins count toward the limit.

Configure `SANCTUM_STATEFUL_DOMAINS` with the actual app host (and port for local development). The admin site and API should share an origin. Keep `APP_DEBUG=false` and use HTTPS in production.
