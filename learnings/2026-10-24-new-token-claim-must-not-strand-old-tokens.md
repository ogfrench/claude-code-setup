---
date: 2026-10-24
source: a private project
tags: [auth, deploy]
status: raw
promoted_to: []
---

# A new required claim in session tokens signs everyone out at deploy unless old tokens can renew

**What happened.** A sessions change added a session id (`sid`) to every new access token,
and made renewal require that the expired token's `sid` match the remember-me session. In
review, every token issued before the deploy had no `sid`. Each of those browsers would
have failed to renew within the 30-minute token lifetime, signing out every user at once.
The tests passed: they only minted new tokens.

**Why.** The renewal check treated "no claim" the same as "wrong claim". Tokens already in
browsers are a migration, just one stored client-side, and the tests created none of them.

**Do instead.** When a claim becomes required, decide what a token without it does, and
test that case. Here a token without a `sid` renews through its own remember cookie, as
before, into a token that has one; a token that names a `sid` still renews only that
session. Write the test with a hand-signed old-format token.

**Evidence.** A backend test and a browser test, each signing a token with no `sid`.
Before the fix renewal was refused (401); after it, renewal succeeds and the new token
carries a `sid`.
