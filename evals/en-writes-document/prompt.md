---
description: A request to write an English document. Claude should open the plain-english skill and write the file in plain language. Needs a Write grant, so run with --allow-tools Write.
expected_outcome: onboarding.md is written, the plain-english skill was invoked, the text is in full sentences with no formal vocabulary.
tags: [en, document, write]
max_turns: 15
timeout_seconds: 400
allowed_tools: [Read, Write, Skill]
---

Write a file called onboarding.md: a guide for a new employee on how to get access to email, the code repository, and the task tracker on their first day. Invent sensible steps yourself and keep it to about one page.
