---
date: 2026-10-26
source: a private project
tags: [testing, browser, tls, sandbox]
status: raw
promoted_to: []
---

# In a proxied sandbox, a browser TLS error means Chromium's own trust store, not the proxy

**What happened.** A cloud sandbox reaches the internet through an egress proxy. curl and node
there loaded the production site fine, but Playwright's Chromium answered
`ERR_CERT_AUTHORITY_INVALID`. Sessions wrote that down as "the sandbox browser can't reach
production", and a visual check on real phone sizes waited days for a person. Diagnosed, it
took five minutes.

**Why.** Two things stack up:

- **The proxy re-signs browser traffic.** It re-signs browser connections with its own CA. A
  plain `openssl s_client` through the same proxy saw the site's real chain, so comparing with
  openssl misleads.
- **Chromium doesn't read the system bundle.** On Linux it trusts only its NSS store,
  `~/.pki/nssdb`, and that store was empty. The proxy's CA was already in the system CA bundle,
  which is where curl and node got their trust.

**Do instead.**

1. **See what the browser actually gets.** Read its certificate chain from a net log
   (`--log-net-log=… --net-log-capture-mode=Everything`), not from openssl.
2. **Trust that CA in NSS.** Take the proxy's CA out of the sandbox's CA bundle and add it with
   `certutil -A -d sql:$HOME/.pki/nssdb -t 'C,,'`. The `certutil` command comes from the
   `libnss3-tools` package.
3. **Keep certificate checks on.** Never reach for `--ignore-certificate-errors`.

The import lasts as long as the container, so write the steps where the next session will find
them.

**Evidence.** `certutil -L` on a fresh store listed nothing. After importing the one CA, the
same Playwright run loaded production and passed. That run covered two emulated phones on a
throttled network: a light iPhone profile and a dark Pixel profile. The phone check that had
waited was closed the same hour.
