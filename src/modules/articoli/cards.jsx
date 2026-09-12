import React from "react";
import { TOKENS, SR_ONLY, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { ZERO } from "../../data/articoli.js";
import AnswerMark from "../../shared/AnswerMark.jsx";
import { LOCATED } from "./feedback.js";

// What an article item looks like on screen, wherever it is asked.
//
// Two screens ask one now: Gli Articoli's own bench (ArticoliModule.jsx) and
// La Piazza's review round, which gained a second question shape so the
// strand could enter the Leitner queue. These five components are what the
// two have in common, and they are here rather than copied because the copy
// is the failure mode this strand has already had once: feedback.js's header
// records a second copy of the five located sentences that had drifted a
// comma from its spoken twin.
//
// What is *not* here is either screen's chrome — the bench's strand header
// and its run summary, the queue's district card and its counter. Each screen
// composes these into its own layout. What travels is the part that would
// otherwise be retyped: the three buttons, the verdict, the rule, the anchor,
// and the one component that knows how to draw the zero article.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// The fourth copy of this component, and like Verdict.jsx's it takes `...rest`
// — nothing here passes `lang` today, and a signature that silently eats one
// is a trap the next caller falls into without a single test going red. That
// is not hypothetical: a `lang` attribute has already vanished into a
// destructure in this repo, and axe cannot see that class of bug.
function Eyebrow({ children, style, ...rest }) {
  return (
    <span
      {...rest}
      style={{
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// One article form as it appears in running text. The zero article is drawn
// as the design draws it — an em dash — which is silence to a screen reader,
// so it carries a name instead. Everything else is Italian and says so.
export function Form({ form }) {
  if (form === ZERO) {
    return (
      <>
        <span aria-hidden="true">{ZERO}</span>
        <span style={SR_ONLY}>no article</span>
      </>
    );
  }
  return <span lang="it">{form}</span>;
}

// The three buttons. `tried` is what has been picked so far on this item and
// `settled` is whether the item is closed, which together decide what each
// button shows: a picked option carries its own mark from the moment it is
// picked, and the answer joins it once the item settles.
//
// aria-disabled rather than `disabled`, the same rule as a shut district on
// the map and a shut bench in the workshop: an option already ruled out keeps
// its place in the tab order instead of vanishing out from under a keyboard
// user mid-item. `onChoose` is therefore still called for a ruled-out option
// and the caller ignores it, rather than the browser swallowing the press.
//
// `firstRef` reaches the first of the three, for a caller that has to put
// focus somewhere when the item changes underneath it. La Piazza does; the
// bench does not, and passes nothing.
export function Options({ options, answer, tried, settled, onChoose, firstRef }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      {options.map((option, i) => {
        const isAnswer = option === answer;
        const wasTried = tried.includes(option);
        const shown = settled ? isAnswer || wasTried : wasTried;

        return (
          <button
            key={option}
            ref={i === 0 ? firstRef : undefined}
            type="button"
            aria-disabled={settled || wasTried ? "true" : undefined}
            onClick={() => onChoose(option)}
            style={{
              ...citySurface(),
              background: shown && isAnswer ? CITY_ACCENTS.pistachio.fill : shown ? CITY_ACCENTS.tomato.fill : TOKENS.card,
              color: shown && isAnswer ? CITY_ACCENTS.pistachio.ink : shown ? CITY_ACCENTS.tomato.ink : TOKENS.ink,
              border: `${CITY_RULES.border}px solid ${shown ? TOKENS.cityInk : TOKENS.controlLine}`,
              flex: 1,
              minWidth: 0,
              padding: "14px 6px",
              fontFamily: SERIF,
              fontSize: 20,
              fontWeight: 600,
              cursor: settled || wasTried ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Form form={option} />
            {shown && <AnswerMark state={isAnswer ? "correct" : "incorrect"} size={14} />}
          </button>
        );
      })}
    </div>
  );
}

// Every visible sentence of the verdict, as markup. The plain-text twin that
// goes to the live region is `announce()` in feedback.js — the two say the
// same things, and both screens' tests check a screen reader isn't told less
// than the screen shows.
//
// The located sentence is read straight out of feedback.js's LOCATED rather
// than restated here. It used to be restated, in five sibling paragraphs, and
// the fusion one had already drifted a comma away from its spoken twin. It is
// the one part of the verdict with no Italian and no Polish in it, so it can
// be a plain string; the paragraph below it, which mixes an Italian sentence
// into English prose, still has to be markup for WCAG 3.1.2.
//
// `id` is optional and exists for a caller that wants to point an
// aria-describedby at the card — La Piazza hangs it off the button that
// carries the item forward, so a keyboard learner who lands there is told
// where the answer went and not merely that it went.
export function ArticleVerdict({ id, verdict }) {
  const accent = verdict.correct ? "pistachio" : verdict.kind === "fusion" ? "lemon" : "tomato";

  return (
    <div id={id} style={{ ...citySurface(accent), padding: "14px 16px", marginTop: 16 }}>
      <Eyebrow style={{ opacity: 0.9, display: "flex", alignItems: "center", gap: 6 }}>
        <AnswerMark state={verdict.correct ? "correct" : "incorrect"} size={14} />
        {verdict.correct ? "Right" : "Not there yet"}
      </Eyebrow>

      <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.55, display: "grid", gap: 6, marginTop: 8 }}>
        {!verdict.correct && <p style={{ margin: 0 }}>{LOCATED[verdict.kind]}</p>}

        {verdict.sentence && (
          <p style={{ margin: 0 }}>
            {verdict.correct ? "Italian writes it " : "The answer is "}
            {!verdict.correct && (
              <>
                <b>
                  <Form form={verdict.answer} />
                </b>
                {". "}
              </>
            )}
            <b lang="it">{verdict.sentence}</b> &mdash; {verdict.en}
          </p>
        )}

        {!verdict.correct && !verdict.last && <p style={{ margin: 0 }}>Have another go &mdash; you get one more.</p>}
      </div>
    </div>
  );
}

// A rule, with its Italian forms marked as Italian and its explanation left
// in the document's own language. "One of the rules", never "the rule": la
// mano is filed under `corpo` and is a deceptive-gender noun as well, and a
// screen that claimed one rule was the whole story would be teaching a
// simplification the data itself does not believe.
export function Rule({ rule, heading = "One of the rules behind it" }) {
  return (
    <div style={{ ...citySurface(), padding: "14px 16px" }}>
      <Eyebrow style={{ color: TOKENS.inkSoft }}>{heading}</Eyebrow>
      <p style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, margin: "8px 0 0", lineHeight: 1.35, color: TOKENS.ink }}>
        {rule.forms.map((form, i) => (
          <React.Fragment key={form}>
            {i > 0 && <span aria-hidden="true"> &middot; </span>}
            <span lang="it">{form}</span>
          </React.Fragment>
        ))}
      </p>
      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "4px 0 0", lineHeight: 1.5 }}>{rule.when}</p>
      <p style={{ fontFamily: SANS, fontSize: 13.5, color: TOKENS.ink, margin: "8px 0 0", lineHeight: 1.55 }}>{rule.says}</p>
    </div>
  );
}

// The Polish anchor, in the design's own pink. Pink means Polish everywhere in
// L'Officina — it is the Polish road in Mappatura delle parole and the Polish
// card here — which is why no strand is allowed to paint itself `bubble`.
//
// It travels with the item into La Piazza rather than being left behind on the
// bench, for the reason La Riserva's second gloss travels: PLAN.md's "Polish
// is a first-class layer" means the Polish half is not an afterthought to be
// dropped the moment an item leaves the screen it was taught on.
export function PolishAnchor({ anchor }) {
  return (
    <div style={{ ...citySurface("bubble"), padding: "14px 16px", marginTop: 14 }}>
      <Eyebrow style={{ opacity: 0.85 }}>
        <span aria-hidden="true">🇵🇱 </span>Why this one is hard
      </Eyebrow>
      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, margin: "8px 0 0" }} lang="pl">
        {anchor.pl}
      </p>
      <p style={{ fontFamily: SANS, fontSize: 13.5, margin: "6px 0 0", lineHeight: 1.55 }}>{anchor.says}</p>
    </div>
  );
}
