# Formatting: the full catalog

This is the detailed half of the "Format generously" rule from [SKILL.md](../SKILL.md). The core idea and its three main points live in the skill itself; the full breakdown by device lives here: lists, images and alt text, scanning, headings, the job of each device, link text, tables, and accessibility. Open the section you need when you format a long or complex document.

The rules below are drawn from the Microsoft Writing Style Guide, the Google developer documentation style guide, the Nielsen Norman Group, and the W3C accessibility guidance. They apply to any prose written in Markdown.

## Lists

### Paragraph, bulleted, numbered, or definition

Any list is allowed; the only question is what kind of material you have.

Use a **paragraph** when the ideas are linked by reasoning — one follows from another through "so", "but", or "because". Breaking that link into bullets loses it. A paragraph holds one topic and runs two to four sentences.

Use a **bulleted list** when you have several items that are equal in rank and whose order does not matter. You could reorder them and lose nothing: a set of settings, a list of things to check, a group of equally weighted reasons.

Use a **numbered list** when the items run in a set order — steps in sequence, stages, or a ranking. Here the order carries the meaning and you cannot shuffle it. A sequence of many steps always goes in a numbered list, never in one solid paragraph.

There is also a third kind, the **definition list**: pairs of "a term and what it means" (Microsoft, Google). Use it when you list several concepts with a short explanation beside each. Markdown has no dedicated markup for it, so build it with a bold run-in: each item starts with the term in bold followed by a period, then the explanation. It looks like this: "**Provenance.** A note of where a fact came from."

### Item length

An item can be a single sentence or a couple of short paragraphs — common practice allows both (Microsoft). But do not force a whole discussion into one item: if several different ideas or a section of its own sit under it, that was a paragraph or a subsection, not an item. Move it back to a paragraph or split it into nested sub-items. A useful gauge: the reader should see at least two, and ideally three, items on screen at once (Microsoft).

### Short paragraphs, details as nested sub-items

Keep each paragraph short — about three to seven lines, and an occasional one-line paragraph is fine (Microsoft). As soon as the topic or the step changes, start a new paragraph and leave a blank line before it. Many ideas in a row without breaks turn into a wall, even when every sentence is correct.

If an item has details of its own, move them into **nested sub-items** with their own indent rather than pouring them into the same line.

There is a subtlety about blank lines inside lists. Always leave a blank line before a list so it separates from the text above it. Put a blank line between items only when the items themselves run a paragraph long; short one-line items stay tight, without blank lines, because they already read well. Decide the spacing for the whole list at once, not item by item — mixed spacing inside one list reads as a mess.

### Items built to one pattern

Express all items with the same parts of speech in the same order. The test is simple: the lead-in phrase plus any single item should read as a normal sentence.

> 🚫 **Poor:** "What we do: Checking documents · we reconcile totals · issue an invoice" — three different forms in a row.
> ✅ **Better:** "What we do: check documents · reconcile totals · issue the invoice".

Strip a repeated lead-word from the start of items (NNG). If every item opens with the same words, the eye trips over the shared part instead of the differences. Move the difference to the front and keep the repeat in the lead-in phrase. Keep items roughly the same length, since a long item beside short ones pulls the eye off balance.

List punctuation rests on one rule (Google, Microsoft). An item that is a full sentence ends with a period. An item that is a fragment, a label, or a short name of three words or fewer takes no period. Be consistent within one list: periods for all, or for none. Do not end an item with ";", ",", "and", or "or".

Introduce every list. Before a list put either a heading, a full sentence, or a fragment ending in a colon (Microsoft, Google). If a heading introduces the list, do not add a colon or an explaining paragraph after it — the items follow straight away. A colon fits only when the list comes right after the lead-in; if other text sits between them, end the lead-in with a period instead.

Keep a list to about seven items (Microsoft). If it runs much longer, split it into groups with their own subheadings, or check whether it is really a table.

### A list is several equal items, and only that

A list shows that several things sit at the same level and read as a group. So a list of one item does not exist: if a level holds only one element, that was a paragraph or a section. The low end is three items (NNG) — two items read better inline in the text, and a vertical list starts at three.

And if the "items" are not actually equal — each is its own topic with its own content — then those are sections, not a list. The tell is simple: an item that is alone at its level, or an item with a whole section under it.

## Images and alt text

An illustration earns its place when it explains something better than words. A caption below it does not repeat what is already visible; it adds what the picture leaves out. Text beats a picture for an abstract idea, for a conversation or a story, for a "before and after" comparison, and for reasoning.

Every meaningful image has **alt text** — a short stand-in for the picture for people who cannot see it (Microsoft, Google). Write the point of it, keep it to about 150 characters, do not open with "image" or "photo" (a screen reader already announces that it is an image), and never use the file name. Give a purely decorative image empty alt text so the reader's screen reader skips it. In Markdown the alt text is the text in square brackets: `![board diagram](address)`, and empty alt is `![](address)`.

Introduce an image with a full sentence before you show it. The reader first learns why to look, and someone who cannot see the picture still gets the explanation.

Do not bake text into an image. Give code, labels, and data as real text or a code block, not a screenshot: text inside a picture is invisible to search and to a screen reader, and cannot be selected or enlarged without going blurry (Google).

## Scanning: how a document is read

A document is scanned by eye first and read second, so it should break into pieces you can take in at a glance: short paragraphs, subheadings, sub-items with bold run-ins. One piece is one topic and two to four sentences. As soon as the topic changes, a new piece begins with its own lead or subheading.

A long section is never one block. It is a short lead plus several labelled pieces, one per idea. Fragmenting is recursive: if a sub-item grows past three or four sentences, split it too, into nested sub-items. No block at any level should stay a wall.

> The balance caveat: fragmenting is about structure, not about sentence length. Inside each piece the sentences stay full and complete — you split paragraphs, not sentences.

**Put the meaningful word first.** This holds for a heading, a list item, a table cell, and a paragraph. People scan by the first words of each line, so a key word at the front gets caught and a key word in the middle gets lost (NNG, Microsoft). A filler opening like "In order to" or "In this section" wastes the most valuable spot.

**Order the whole document from most important to least.** The conclusion comes first, then details in falling order of importance. A reader can stop anywhere and still carry away the point. Put the most important material in the first paragraph or two, because attention drops sharply below that (NNG). This is the inverted pyramid.

**Open a long section with a short summary.** A couple of sentences, or a bulleted list of the key points, before the main text. From it the reader decides in seconds whether to read on, and you do the work of picking out the point instead of the reader.

**You can separate blocks with more than a heading.** A horizontal rule — three hyphens `---` on their own line — gives a clean break where you do not want a new heading but do want to set a block apart (NNG).

**Give a long document a table of contents** — anchor links to its own headings, plus a "Back to top" link at the end of large sections (Microsoft, NNG). The reader sees a map and jumps to the right place instead of scrolling through everything. In Markdown these are ordinary links like `[Section name](#section-name)`.

## Headings

Headings carry the structure; bold text does not. Bold is a way to emphasise a word inside a line, not to name a section.

If a piece names a section that has content of its own — its own paragraphs or its own list — make it a real heading, not a bold item. Use the full range of levels from `#` to `#####`: the deeper a section is nested, the deeper its heading. That gives the document a real outline you can see and jump through, and it renders the same in any viewer.

Keep bold to one or two words for emphasis and to the lead-in of a short piece that does not warrant its own section. Keep bold sparse: NNG measurements suggest no more than about three parts in ten should be highlighted, or the emphasis stops helping the eye.

Do not skip heading levels. `##` is followed by `###`, not straight by `#####` (Google, W3C WAI). Skipping breaks the outline and the navigation for anyone moving by headings. English headings use sentence case — a capital on the first word only.

A heading does not end with a period; a question mark is fine if the sense needs it (Microsoft). Keep headings at one level in the same form, the way list items are kept parallel: for example, every subheading of a section starts with a noun, or every one starts with a verb.

A heading must be meaningful, not a generic word and not a play on words (Google, NNG). The reader decides from the heading whether to read the section, so "Overview", "Miscellaneous", and clever riddle-headings do not work — they give the reader nothing to decide on. Lead the heading with what matters to the reader, not with the name of a feature, a command, or a product.

Match the form of the heading to the sense of the section (Google, Microsoft). A section about an action gets a verb heading: "Create a copy". A section about a concept gets a noun-phrase heading: "How copies work". Do not start a heading with an "-ing" word. And make a lower-level heading more specific than its parent, so the hierarchy reads from general to particular.

The top-level heading (`#`) is one per document — it is the document's title. Everything below is `##` and deeper. There should not be several top-level headings in one file (Google).

Do not put a link, a hand-typed section number, or code in backticks inside a heading (Google). A link in a heading is confused with the heading's own style; hand numbering breaks when a section is inserted or removed; code makes the outline unreadable for someone searching by meaning. Move the link into the text under the heading.

Two headings in a row with no text between them is a mistake (Google, Microsoft). If there is nothing to write under the upper heading before the first subheading, then the subheading is unneeded or the two headings repeat each other.

A short label is a bold run-in, not a heading of its own. Keep a one- or two-line note like "See also" as a bold lead-in to a paragraph (Microsoft calls this a run-in heading). Start a real `####` heading only when two or more distinct subtopics, or a sizeable block of text, sit under it. One level of headings is usually enough for a page or two (Microsoft), so do not split every small note into its own heading.

## The job of each device

Choose a device by how the content is built, not by habit.

- **Heading** — the name of a section that holds something.
- **List** — several equal items that read together.
- **Paragraph** — connected reasoning.
- **Bold** — emphasis on one or two words, the lead-in of a short piece, or the name of a button or field. Not for emotional weight.
- **Italic** — introducing a new term that you define on the spot; a word used as a word; the title of a whole work; a variable. Occasionally, an aside. Do not overuse italic (Google, Microsoft).
- **Inline code** (backticks) — anything typed literally: a file path, a command and its flags, a file extension, a function name, a literal label from an interface. Code font separates "type exactly this" from ordinary prose (Microsoft, Google).
- **Underline** — link text only. Underlined text is taken for a link, so do not use underline for emphasis (Google). Plain Markdown has no underline of its own anyway.
- **Blockquote** (`>`) — something to the side of the main line: caveats and notes; also a callout for a key figure, quote, or definition, and a warning notice.
- **Table** — comparison across several attributes (see Tables), or "before and after".

Warning notices come in different strengths (Google): a plain note "for your information", a "proceed with care", and a "do not do this, the step cannot be undone". Choose the kind by the risk, and do not hide required steps inside a note — a note reads as "you may skip this". Do not overuse notices or stack two together: if half the text is in boxes, the eye stops seeing them.

> A note on Markdown: plain Markdown has no coloured notice boxes — only the plain blockquote `>`. So carry the kind of notice in a bold lead word: "**Caution.** …". Coloured callouts with an icon (`> [!WARNING]`) are a GitHub extension, not general Markdown, and will not work in another viewer.

## Link text

Link text names the page or its content and makes sense on its own, without the sentence around it. Bare words like "here", "click here", "read more", "this document", and a bare URL do not work as link text (Microsoft, Google, NNG). The reason is not only convenience: a screen reader reads out all the links on a page as a separate list, and a list of "here, here, here" is useless.

Put the meaningful word at the front of the link — people read the first two words. Keep the text short, about four words or fewer, not a whole sentence.

Give different destinations different text. A reader takes two links with the same wording to lead to the same place, so use identical text only for links to the same page.

Keep punctuation outside the link, and do not set the link itself in bold or italic — it is already recognised by its own style, and extra weight blurs that. If a link leads to a PDF or a file rather than an ordinary page, warn the reader with a word beside it: "Guide (PDF)".

> 🚫 **Poor:** "The full write-up is [here](address)."
> ✅ **Better:** "The full write-up is in the [decision log](address)."

## Tables

Use a table not when a list is long but when each element has several comparable attributes — roughly three or more related fields per row (Google). If an element has one attribute or a pair, that is a list, not a table. A plain list of similar things does not go into a table.

Build the table by a few rules that Microsoft and Google agree on.

- Put the thing that names the row in the left column. Then you find the row you need down the left edge, the way you find a section by its heading.
- Make column headers specific and short: not "Name" but "Team" or "Employee", with no period at the end.
- Leave no empty cells. If there is no value, write the word — "None" or "Not applicable" — not a dash: an empty cell is ambiguous and a screen reader reads it as silence.
- Keep entries within a column to one pattern, the same way list items are parallel.
- Introduce a table with a full sentence ending in a period, not a fragment with a colon. A list may take a fragment lead-in, but a table takes a finished thought, because a screen reader gives no warning that a table is coming.

Do not use a table for layout. Do not lay out a page with it, do not split a long one-dimensional list into columns, do not show code in it, and do not drop it into the middle of a numbered procedure (Google).

> A note on Markdown: plain Markdown makes only simple tables. It takes the first row as the header on its own, and it cannot merge cells — which is just as well, since merged cells are disallowed anyway. What Markdown cannot do at all: colour, a sticky header, set column widths, or a linked table caption. A wide table should scroll sideways inside its own block, and that is the viewer's job, not Markdown's.

## Accessibility: "above", "below", and colour

Do not rely on "above", "below", "left", "right", or on colour as the only way to show a place or a meaning (Google, Microsoft). A Markdown document reflows to the width of the screen, so "in the table below" may be false on a narrow screen, and for someone hearing the text through a screen reader "on the right" and "the green row" mean nothing.

The fix is simple. Instead of "in the diagram above" write "in the previous diagram"; instead of "the button on the right" write "the Save button". If colour carries the meaning, repeat it in a word or an icon.
