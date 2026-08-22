# Word swaps: strict list and examples

This is the full version of rule 3, "Use short, everyday words". It comes in two parts, and the split matters for how the list is used.

- The **strict list** holds words whose plain replacement is right in almost every context. A machine check can flag these literally, and the swap will be safe.
- The **judgment list** holds words with a narrow or technical sense, a context exception, or a different part of speech. A machine must not auto-flag these, because the swap is often wrong. The model decides, case by case.

The lists come from the [US federal plain-language word suggestions](https://www.plainlanguage.gov/guidelines/words/use-simple-words-and-phrases/) and the [GOV.UK A-to-Z style guide](https://www.gov.uk/guidance/style-guide/a-to-z-of-gov-uk-style).

> If a machine check is built for this skill, transcribe only the **strict list** into its rules file. The judgment list stays here as guidance for the model, not as machine rules.

## Strict list — safe to flag literally

Each of these is a near drop-in replacement: the plain word means the same thing and fits the same slot in nearly every sentence.

| Instead of | Write |
|---|---|
| utilise, utilize | use |
| commence | start |
| ascertain | find out |
| endeavour | try |
| obtain | get |
| assist | help |
| demonstrate | show |
| sufficient | enough |
| approximately | about |
| regarding, with regard to | about |
| prior to | before |
| subsequent to | after |
| in order to | to |
| in the event that | if |
| in the majority of cases | usually |
| at this time, at present | now |

## Judgment list — the model decides

These need a look at the sentence first. Some carry a technical meaning; some change meaning with the part of speech.

### Words with a narrow or technical sense

| Word | Usually write | Keep the word when |
|---|---|---|
| purchase | buy | it is the noun "a purchase" |
| terminate | end, stop | it is a technical term (terminate a process, a contract) |
| require | need | a formal legal register is intended |
| leverage | use, influence | it is the financial sense |
| deliver | make, provide | it is literal delivery of goods |
| impact | affect, have an effect on | it is the noun, or a physical impact |
| facilitate | run, help, arrange | no plain verb fits the exact action |
| collaborate, liaise | work with | — |
| progress (verb) | work on, develop | it is the noun "progress" |
| tackle | deal with | it is the sport or the physical sense |
| empower | allow, give permission | — |
| dialogue | discussion, talk | — |
| agenda | plan | it is a meeting agenda |

### Hidden verbs — a pattern, not a fixed list

A verb turned into a noun makes the sentence longer and weaker. The point is to spot the pattern — noun endings like `-tion`, `-ment`, `-sion`, and `-ance` — and turn the noun back into a verb. These are examples of the pattern, not an exhaustive set to match:

- conduct an analysis of → analyse
- make a decision → decide
- provide assistance to → help
- give consideration to → consider
- carry out a review of → review
- is responsible for the management of → manages

### Empty phrases to consider cutting

These usually add no meaning, but cutting them means rephrasing, not a one-to-one swap. Flag them for a look, do not auto-replace:

- **going forward** — usually drop it; the present tense already means from now on.
- **the fact that** — often removable ("aware of the fact that" → "aware that").
- **it should be noted that** — drop it and state the point.
- **please note** — drop it in instructions.
