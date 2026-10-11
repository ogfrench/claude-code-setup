# Security

- **A valid credential is not authorization.** Every route that reads per-account data
  compares the caller with the owner. If any account can mint the credential (an API key),
  "behind a key" gates nothing. *(2026-10-11-api-key-is-not-authorization)*
- **Test with the wrong account, not only with none.** Probe as anonymous and as two
  accounts, A against B's things, on a live local stack. A missing credential is the easy
  case.
- **One function builds every client payload,** and it strips solutions for every type.
  Grep for every sender and route them through it.
  *(2026-10-11-strip-solutions-from-client-payloads)*
- **Docs that claim a check are not evidence of the check.** Read the code or probe it; fix
  the doc when it is wrong.
