# Formatting: the full catalog

This is the detailed half of the "Format generously" rule from [SKILL.md](../SKILL.md). The core idea and its three main points live in the skill itself. The full breakdown by device lives here: lists, images and alt text, scanning, headings, link text, tables, and accessibility. Open the section you need when you format a long or complex document.

These rules come from four sources: the Microsoft Writing Style Guide, the Google developer documentation style guide, Nielsen Norman Group research, and W3C accessibility guidance. They apply to any prose you write in Markdown.

## Lists

### Paragraph, bulleted, numbered, or definition

Every kind of list has its place. The question is what material you hold.

Use a **paragraph** when reasoning links the ideas, so that one follows from another through "so", "but", or "because". Bullets break that link and lose it. A paragraph holds one topic and runs two to four sentences.

Use a **bulleted list** for several items of equal rank whose order does not matter. You could reorder them and lose nothing: a set of settings, a list of checks, a group of equal reasons.

Use a **numbered list** when the items run in a set order — steps in sequence, stages, or a ranking. Here the order carries the meaning and you cannot shuffle it. A sequence of many steps always goes in a numbered list, never in one solid paragraph.

A third kind, the **definition list**, pairs "a term and what it means" (Microsoft, Google). Use it when you list several concepts with a short explanation beside each. Markdown has no markup for it, so build it with a bold run-in. Each item opens with the term in bold and a period, then the explanation: "**Provenance.** A note of where a fact came from."

### Item length

An item can be a single sentence or a couple of short paragraphs, and common practice allows both (Microsoft). Do not force a whole discussion into one item. If several ideas or a section of its own sit under it, that was a paragraph or a subsection. Move it back to a paragraph, or split it into nested sub-items. One gauge helps: the reader should see two or three items on screen at once (Microsoft).

### Short paragraphs, details as nested sub-items

Keep each paragraph short — about three to seven lines, and an occasional one-line paragraph is fine (Microsoft). As soon as the topic or the step changes, start a new paragraph and leave a blank line before it. Many ideas in a row without breaks turn into a wall, even when every sentence is correct.

If an item has details of its own, move them into **nested sub-items** with their own indent rather than pouring them into the same line.

Blank lines inside a list carry a subtlety. Always leave a blank line before a list, so it separates from the text above. Put a blank line between items only when the items themselves run a paragraph long. Short one-line items stay tight and already read well. Decide the spacing for the whole list at once: mixed spacing inside one list reads as a mess.

### Steps in a procedure

A reader works a procedure with their hands while their eyes run down the lines. A step therefore follows its own shape.

- **Open each step with an imperative verb**, which the reader scanning for the thing to press finds at once.
- **Name the place before the action:** "In profile settings, select Save", because a place at the end registers too late.
- **Keep one action per step.**
- **Say what changed on screen**, so the reader knows whether to wait: "Select Run, and the results appear after a few seconds".
- **Put a single step in a bullet**, because numbering exists to carry a sequence.

Sources: [Google, procedures](https://developers.google.com/style/procedures) and [Microsoft, step-by-step instructions](https://learn.microsoft.com/en-us/style-guide/procedures-instructions/writing-step-by-step-instructions).

### A lead-in says what the list means

The line before a list does more than announce that a list follows. It tells the reader what the set adds up to. "Three rules cover almost every table mistake" works, while "Here is a list of rules" does not.

### Items built to one pattern

Express all items with the same parts of speech in the same order. The test is simple: the lead-in phrase plus any single item should read as a normal sentence.

> 🚫 **Poor:** "What we do: Checking documents · we reconcile totals · issue an invoice" — three different forms in a row.
> ✅ **Better:** "What we do: check documents · reconcile totals · issue the invoice".

Strip a repeated lead-word from the start of items (NNG). If every item opens with the same words, the eye trips over the shared part instead of the differences. Move the difference to the front and keep the repeat in the lead-in phrase. Keep items roughly the same length, since a long item beside short ones pulls the eye off balance.

List punctuation rests on one rule (Google, Microsoft). An item that is a full sentence ends with a period. An item that is a fragment, a label, or a short name of three words or fewer takes no period. Be consistent within one list: periods for all, or for none. Do not end an item with ";", ",", "and", or "or".

Introduce every list. Before a list put either a heading, a full sentence, or a fragment ending in a colon (Microsoft, Google). If a heading introduces the list, do not add a colon or an explaining paragraph after it — the items follow straight away. A colon fits only when the list comes right after the lead-in; if other text sits between them, end the lead-in with a period instead.

Keep a list to about seven items (Microsoft). If it runs much longer, split it into groups with their own subheadings, or check whether it is really a table.

### A list is several equal items, and only that

A list shows that several things sit at the same level and read as a group. So a list of one item does not exist. If a level holds only one element, that was a paragraph or a section. The low end is three items (NNG): two items read better inline, and a vertical list starts at three.

Where the "items" are not equal, and each carries its own topic and content, those are sections. The tell is simple: an item alone at its level, or an item with a whole section under it.

## Images and alt text

An illustration earns its place when it explains something better than words. A caption below it adds what the picture leaves out, rather than repeating what the reader can see. Text beats a picture for an abstract idea, for a story, for a "before and after" comparison, and for reasoning.

Every meaningful image carries **alt text**, a short stand-in for the picture for people who cannot see it (Microsoft, Google). Write the point of the image and keep it to about 150 characters. Open with the content itself: a screen reader already announces that it is an image, and the file name tells the reader nothing. Give a purely decorative image empty alt text, so a screen reader skips it. In Markdown the alt text sits in square brackets: `![board diagram](address)`, and empty alt is `![](address)`.

Introduce an image with a full sentence before you show it. The reader first learns why to look, and someone who cannot see the picture still gets the explanation.

Keep text out of an image. Give code, labels, and data as real text or a code block. Text inside a picture hides from search and from a screen reader, and it blurs when the reader enlarges it (Google).

## Scanning: how people read a document

Readers scan a document first and read it second. It therefore breaks into pieces you can take in at a glance: short paragraphs, subheadings, sub-items with bold run-ins. One piece is one topic and two to four sentences. As soon as the topic changes, a new piece begins with its own lead or subheading.

A long section is never one block. It is a short lead plus several labelled pieces, one per idea. Fragmenting is recursive: if a sub-item grows past three or four sentences, split it too, into nested sub-items. No block at any level should stay a wall.

> The balance caveat: fragmenting is about structure, not about sentence length. Inside each piece the sentences stay full and complete — you split paragraphs, not sentences.

**Put the meaningful word first.** This holds for a heading, a list item, a table cell, and a paragraph. People scan by the first words of each line. A key word at the front catches the eye, and one in the middle disappears (NNG, Microsoft). A filler opening such as "In this section" wastes the most valuable spot.

**Order the whole document from most important to least.** The conclusion comes first, then details in falling order of importance. A reader can stop anywhere and still carry away the point. Put the most important material in the first paragraph or two, where attention is highest (NNG). This is the inverted pyramid.

**Open a long section with a short summary.** Give a couple of sentences, or a bulleted list of the key points, before the main text. The reader then decides in seconds whether to read on, because you picked out the point for them.

**Separate blocks with more than a heading.** A horizontal rule, three hyphens `---` on their own line, sets a block apart cleanly (NNG).

**Give a long document a table of contents:** anchor links to its own headings, plus a "Back to top" link in large sections (Microsoft, NNG). The reader sees a map and jumps straight to the right place. In Markdown these are ordinary links like `[Section name](#section-name)`.

## Headings

Headings carry the structure; bold text does not. Bold is a way to emphasise a word inside a line, not to name a section.

When a piece names a section with content of its own, make it a real heading rather than a bold item. Use the full range of levels from `#` to `#####`, and give a section as deep a heading as its nesting. The document then has a real outline you can see and jump through, and it renders the same in any viewer.

Keep bold to one or two words for emphasis, and to the lead-in of a short piece that does not warrant its own section. Keep it sparse. NNG measurements put the ceiling at about three parts in ten, beyond which the emphasis stops helping the eye.

Do not skip heading levels: `###` comes after `##`, never `#####` (Google, W3C WAI). Skipping breaks the outline and the navigation for anyone moving by headings. English headings use sentence case, with a capital on the first word only.

A heading does not end with a period, though a question mark is fine where the sense needs it (Microsoft). Keep headings at one level in the same form, the way list items stay parallel. Every subheading of a section opens with a noun, say, or every one opens with a verb.

A heading must be meaningful, rather than a generic word or a play on words (Google, NNG). The reader decides from the heading whether to read the section. "Overview", "Miscellaneous", and clever riddle-headings give them nothing to decide on. Lead the heading with what matters to the reader, ahead of the name of a feature, a command, or a product.

Match the form of the heading to the sense of the section (Google, Microsoft). A section about an action gets a verb heading: "Create a copy". A section about a concept gets a noun-phrase heading: "How copies work". Do not start a heading with an "-ing" word. And make a lower-level heading more specific than its parent, so the hierarchy reads from general to particular.

The top-level heading (`#`) is one per document — it is the document's title. Everything below is `##` and deeper. There should not be several top-level headings in one file (Google).

Keep a link, a hand-typed section number, and code in backticks out of a heading (Google). A link there blends into the heading's own style. Hand numbering breaks as soon as you insert or remove a section, and code makes the outline unreadable for someone searching by meaning. Move the link into the text under the heading.

Two headings in a row with no text between them is a mistake (Google, Microsoft). When the upper heading has nothing to say before the first subheading, either the subheading has no job or the two headings repeat each other.

A short label is a bold run-in, not a heading of its own. Keep a one- or two-line note like "See also" as a bold lead-in to a paragraph (Microsoft calls this a run-in heading). Start a real `####` heading only when two or more distinct subtopics, or a sizeable block of text, sit under it. One level of headings is usually enough for a page or two (Microsoft), so do not split every small note into its own heading.

### A heading and the line beneath it

A subheading has to read on its own, apart from the document title and the parent section. The first sentence under it picks up the topic the heading promised and does not wander off. A short description of the document is not repeated as the opening paragraph.

## The job of each device

Choose a device by the shape of the content, ahead of habit.

- **Heading** — the name of a section that holds something.
- **List** — several equal items that read together.
- **Paragraph** — connected reasoning.
- **Bold** — emphasis on one or two words, the lead-in of a short piece, the name of a button or field.
- **Italic** — a new term you define on the spot; a word used as a word; the title of a whole work; a variable. Use it sparingly (Google, Microsoft).
- **Inline code** (backticks) — anything typed literally: a file path, a command, a file extension, a function name, an interface label. Code font separates "type exactly this" from ordinary prose (Microsoft, Google).
- **Underline** — link text only, because a reader takes underlined text for a link (Google). Plain Markdown has no underline of its own anyway.
- **Blockquote** (`>`) — material to the side of the main line: caveats, notes, a callout, and a warning notice.
- **Table** — comparison across several attributes (see Tables), or "before and after".

Warning notices come in three strengths (Google): a plain note, a "proceed with care", and a "do not do this, the step cannot be undone". Choose the kind by the risk. Keep required steps out of a note, because a note reads as "you may skip this". Two notices stacked together, or half the text in boxes, and the eye stops seeing them.

> A note on Markdown: plain Markdown has no coloured notice boxes — only the plain blockquote `>`. So carry the kind of notice in a bold lead word: "**Caution.** …". Coloured callouts with an icon (`> [!WARNING]`) are a GitHub extension, not general Markdown, and will not work in another viewer.

## Link text

Link text names the page or its content and makes sense on its own, without the sentence around it. Bare words such as "here", "click here", "read more", and a bare URL fail as link text (Microsoft, Google, NNG). Convenience is not the only reason. A screen reader reads out all the links on a page as a separate list, and a list of "here, here, here" is useless.

Put the meaningful word at the front of the link — people read the first two words. Keep the text short, about four words or fewer, not a whole sentence.

Give different destinations different text. A reader takes two links worded alike to lead to the same place. Use identical text only for links to one page.

Keep punctuation outside the link, and leave the link itself in its own style. Bold or italic on top blurs the style that already marks it. Where a link leads to a PDF or another file, warn the reader with a word beside it: "Guide (PDF)".

> 🚫 **Poor:** "The full write-up is [here](address)."
> ✅ **Better:** "The full write-up is in the [decision log](address)."

### Cross-references and bracketed asides

Three rules govern how a text sends the reader elsewhere.

- **Place a link where the text needs it**, citing a source at the point where you give its facts, never gathered under "Further reading".
- **Keep cross-references rare**, about one per section and at the end of a passage, and repeat a short passage instead of pointing at it.
- **Lift a long bracketed aside into its own sentence**, keeping brackets for a short gloss, a source, a unit, or a file format.

### Ranges, and error and success messages

- **Write a range with a word:** `10am to 11am`, `500 to 900`. A hyphen reads as a minus sign, and a screen reader skips it; keep hyphens for tables.
- **An error message never blames the person.** Say what happened, what follows, and what they can do right now.
- **Name the cause when you know it** and offer the fix; when you do not, say so plainly and give a fallback route.
- **Replace "Operation completed successfully"** with the useful fact: "Sent 1,200 to Vodafone".

## Tables

Use a table when each element has several comparable attributes, roughly three or more related fields per row (Google). Length alone is no reason. An element with one attribute or a pair belongs in a list, and so does a plain run of similar things.

Build the table by a few rules that Microsoft and Google agree on.

- Put the thing that names the row in the left column. Then you find the row you need down the left edge, the way you find a section by its heading.
- Make column headers specific and short, so "Team" or "Employee" beats "Name", with no period at the end.
- Leave no empty cells: write "None" or "Not applicable" rather than a dash, because a screen reader reads an empty cell as silence.
- Keep entries within a column to one pattern, the same way list items are parallel.
- Introduce a table with a full sentence ending in a period. A list may take a fragment lead-in, while a table needs a finished thought: a screen reader gives no warning that one is coming.

Keep tables out of layout work. Leave page layout, a long one-dimensional list split into columns, code, and the middle of a numbered procedure to other devices (Google).

> A note on Markdown: plain Markdown makes only simple tables. It reads the first row as the header on its own, and it merges no cells, which suits the rules anyway. It also has no colour, no sticky header, no column widths, and no linked caption. A wide table should scroll sideways inside its own block, and that falls to the viewer.

## Accessibility: "above", "below", and colour

Name a place by its content rather than by "above", "below", "left", "right", or colour alone (Google, Microsoft). A Markdown document reflows to the width of the screen, so "in the table below" can be false on a narrow one. For someone hearing the text through a screen reader, "on the right" and "the green row" mean nothing.

The fix is simple. Instead of "in the diagram above" write "in the previous diagram"; instead of "the button on the right" write "the Save button". If colour carries the meaning, repeat it in a word or an icon.
