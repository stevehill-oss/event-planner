# Hospitality Planner

Three stand-alone tools for Prestige Corporate Events, built to sit inside a blog post:

1. Occasion Matchmaker: seven questions, then a shortlist of real, live event pages.
2. Is Hospitality Worth It?: the most hospitality is worth to the visitor, on their own figures.
3. Corporate ROI: the return, the break-even point and the most to spend per head.

Every result ends on the event page's enquiry or waitlist form. The visitor's brief is copied
on click, ready to paste into the form's Message box.

## Files

- `index.html`, `css/app.css`: the page.
- `js/events.js`: live events from the website, generated. Never edit by hand.
- `js/core.js`: dates, links (with tracking tags), images, embed support.
- `js/match.js`, `js/worth.js`, `js/roi.js`: the three tools.

## Refresh the event list (weekly)

    node dev/build-events.mjs

Then commit and push. Finished events also drop off by themselves each day.

## Page options

- `#match`, `#worth`, `#roi`: opens that tool.
- `?embed=1`: hides the header and footer, for an iframe.
- `?only=worth`: one tool, no switcher.
- `?event=<event slug>`: preselects an event.

## Embedding

The iframe needs `allow="clipboard-write"`, or the brief cannot be copied inside a blog.

## Tracking events (dataLayer, and postMessage to the blog when embedded)

- `planner_match_step`: each Matchmaker answer (step, n, answer), for drop-off.
- `planner_match_complete`, `planner_match_share`: shortlist shown, shortlist copied.
- `planner_worth_result`, `planner_roi_result`, `planner_roi_case_open`.
- `planner_enquiry_click` (tool, event_slug) and `planner_call_click` (tool).

## Rules baked in

- No prices from us. Every money figure is typed by the visitor.
- Only published, indexable, public event pages are listed.
- Links carry utm_source=hospitality-planner.
- The page is set to noindex.
