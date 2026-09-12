---
description: A code request. The writing rules are for prose, so the plugin must not get in the way and must not open a writing skill.
expected_outcome: The reply contains a Python function and neither writing skill was invoked.
tags: [code, negative]
max_turns: 5
allowed_tools: [Skill]
---

Write a Python function that checks whether a string is a palindrome, ignoring case and spaces.
