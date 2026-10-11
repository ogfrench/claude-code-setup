# UI

- **One shape, one border, one focus ring for every text field,** whatever draws it.
  Corners vary by tier (controls tighter than cards), never by library.
  *(2026-10-11-third-party-editor-overrides)*
- **Configure a third-party widget through its config, not by patching its DOM after
  creation.** Its render loop rewrites attributes such as `aria-label`. For its CSS, match
  or exceed its own selectors. *(2026-10-11-third-party-editor-overrides)*
- **Check accessible names after an edit, not only on load.** Look the field up by its name
  in a test after typing into it.
- **Theme with tokens, never hardcoded black or white,** and check both themes and a phone
  width before calling a screen done.
