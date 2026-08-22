#!/bin/bash
# Per-turn reminder of the "write simply + format generously" rules for English text.
# Injected into the model's context via UserPromptSubmit -> additionalContext.
#
# Design: this hook is paid on EVERY message, so it carries only the short core that
# erodes over a long conversation. The full rulebook lives in the companion skill
# "plain-english" and is loaded on demand, not repeated here.
#
# Note: install only ONE writing hook at a time. If you also install the Russian
# hook (write-simply-reminder.sh), both fire every turn and duplicate the reminder.
cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"WRITE SIMPLY — rule for English prose (chat and documents; not for code, commit messages, or other languages): 1) Lead with the point — the first sentence is the answer, then details in falling order of importance (inverted pyramid). 2) MOST OFTEN BROKEN: write full, plain sentences, not headline fragments — each idea is a complete sentence with a subject and a verb; check any sentence over 25 words and split it. 3) Use short, everyday words; avoid formal or Latinate ones (utilise->use, in order to->to, approximately->about). 4) Use the active voice and strong verbs; do not hide a verb inside a noun (conduct an analysis->analyse, make a decision->decide). 5) Write to the reader as 'you' and in the present tense; explain a specialist term the first time you use it and spell out an abbreviation on first use. 6) Keep the tone neutral and factual — no subjective adjectives, no hype, no ALL-CAPS runs. 7) Format generously, on purpose: a bulleted list for equal unordered items, a numbered list for steps, a paragraph for connected reasoning; a single item is a paragraph, not a list. Keep paragraphs short (up to about five sentences). Structure is carried by headings (####, #####), not by bold; do not skip levels (## then ###). Put the meaningful word at the front of every heading, item, and paragraph. A long section is a short lead plus several labelled pieces, not one wall of text; put a caveat or note in a blockquote (>). 8) Every link's text names where it goes — never 'here', 'click here', or a bare URL. 9) Before sending, reread and read one paragraph aloud — ask not 'is it shorter' but 'is it clear on the first read'. Full rules — the 'plain-english' skill (load it for documents and long text)."}}
JSON
