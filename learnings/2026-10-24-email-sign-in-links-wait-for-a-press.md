---
date: 2026-10-24
source: a private project
tags: [security, auth]
status: raw
promoted_to: []
---

# A sign-in link in an email must not sign in on load: mail scanners open links and run pages

**What happened.** A passwordless sign-in email carried a link and a code. The link's page
posted its token as soon as it loaded. Eighteen seconds after an email went to a company
address, a new session appeared on the account from a cloud IP, with a desktop browser user
agent. The person's own click then failed, because the scanner had spent the link.

**Why.** Corporate mail security scanners follow every link in a message, and modern ones run
the page's JavaScript to detect phishing. A page that acts on load acts for the scanner. The
session it got could read and change the account until revoked.

**Do instead.** Make the link page show a button and act only when it is pressed. Scanners
load pages; they don't press buttons. Keep the button disabled until the page has hydrated, or
an early tap does nothing. Binding the link to the requesting browser with a cookie is
stricter, but it breaks asking on a laptop and opening the email on a phone. After the fix,
check the account's sessions for scanner sessions left from before, and revoke them.

**Evidence.** On production, a test email two minutes before signing in with the code left no
session but the code's own. Before the fix, the same flow created a scanner session.
