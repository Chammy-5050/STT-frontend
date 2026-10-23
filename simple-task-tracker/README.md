# Simple Task Tracker

## Sign-in setup

The login page is available at `/login`. The browser posts to the Next.js
`/api/auth/login/` route, which proxies credentials to
`AUTH_API_BASE_URL/api/auth/login/`. The upstream endpoint should return a
JSON object containing one of `access`, `access_token`, `token`, or `key`,
and a non-empty `user.role` string. The route
stores the token in an httpOnly `stt_session` cookie and never returns it to
the browser. Set `AUTH_API_BASE_URL` in the server environment.

For local UI work without a backend, set `MOCK_AUTH=true`. The mock account is
`demo@example.com` with password `password123`. The mock implementation only
runs in the server route and returns a session cookie; do not enable it in
production.

When “Remember me” is selected, the route gives the cookie a 30-day lifetime.
Otherwise it is a browser-session cookie.

## Registration setup

The registration page is available at `/register` and posts to the same-origin
`/api/auth/register/` route. That route proxies to
`AUTH_API_BASE_URL/api/auth/register/` with `full_name`, `email`, `password`,
`password_confirm`, and `terms_accepted`. Configure the backend to hash
passwords with a modern password-hashing algorithm, validate the same password
rules, verify email ownership, and rate-limit registration attempts. Passwords
are sent only to the server endpoint and are not saved in browser storage or
logged by this app. Successful registration does not create a login session;
the user is directed to `/login`.

With `MOCK_AUTH=true`, registration only simulates success and does not save an
account. The confirmation explicitly identifies this development-only mode.

Run focused tests with `npm test`. Run linting with `npm run lint`.
