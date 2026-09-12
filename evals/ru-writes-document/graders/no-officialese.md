---
type: regex
pattern: '(?<![а-яё])(осуществл|является|данн(ый|ая|ое|ые)|в целях|в рамках|надлежащ|посредством)'
flags: i
match: not_contains
target: { source: file, path: onboarding.md }
---
