---
date: 2026-10-18
source: ogfrench/frogQuiz
tags: [tooling, testing]
status: raw
promoted_to: []
---

# In openpyxl, `sheet.cell(row, col, None)` does not clear a cell

**What happened.** A test cleared a template's sample rows with `sheet.cell(r, c, None)` before writing its own. The samples stayed, and the parser under test reported errors from cells the test thought were empty.

**Why.** `cell(row, column, value=None)` only assigns when the value is not None. With None it just returns the cell.

**Do instead.** Assign `sheet.cell(r, c).value = None` to clear a cell, and write values the same way in tests.

**Evidence.** frogQuiz `frogquiz/tests/test_excel_types.py`: two failures disappeared with the helper rewritten to assign `.value`.
