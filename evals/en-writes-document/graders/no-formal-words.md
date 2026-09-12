---
type: regex
pattern: '\b(utili[sz]e[sd]?|in order to|leverage[sd]?|facilitate[sd]?|commence[sd]?|prior to|ensure that|please note)\b'
flags: i
match: not_contains
target: { source: file, path: onboarding.md }
---
