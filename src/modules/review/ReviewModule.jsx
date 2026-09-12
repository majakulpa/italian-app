import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { loadProgress, saveProgress, todayISO } from "../../shared/storage.js";
import { dueItems, dueCount, reviewItem, SESSION_LIMIT } from "../../shared/srs.js";
import { districtById, districtForModule } from "../../shared/districts.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import { toQuestion } from "./question.js";
import { judge, reveal, announce, answered, ATTEMPTS } from "../../shared/locatedFeedback.js";
import Verdict from "../../shared/Verdict.jsx";
import {
  judge as judgeArticle,
  announce as announceArticle,
  ATTEMPTS as ARTICLE_ATTEMPTS,
} from "../articoli/feedback.js";
import { Options, ArticleVerdict, Rule, PolishAnchor } from "../articoli/cards.jsx";
import { solidThisWeek, WEEK_DAYS } from "./week.js";

// La Piazza — the review district, and design screen 18.
//
// The design calls this "the most important interaction in the app: a wrong
// answer gets *located*, never solved". Until now it was the opposite of
// that: four buttons, a red cross, and the answer handed over on the spot —
// the weakest feedback shape available, and the stated reason Mappatura delle
// parole and Gli Articoli both stayed outside the queue rather than be
// answered that way. So this screen is rebuilt around two changes.
//
// **Production, not recognition.** Almost every item is typed. A grammar item
// already carries a gapped sentence and one answer, so the gap is the
// question and its authored `options` are never drawn — they become a
// feedback signal instead. A vocabulary item is asked by its English gloss,
// with its own example sentence gapped underneath as disambiguating context.
// question.js builds both.
//
// The exception is Gli Articoli, and it is an exception on purpose. An article
// item is a choice between three authored forms, one of which can be the zero
// article; there is no text box that could ask it, because "write the article"
// with no line-up is asking the learner to guess which of ten forms was in
// play. So the round has a second question shape — `q.options` non-empty —
// which draws the strand's own three buttons and routes to the strand's own
// judge. Both halves are imported from modules/articoli rather than rebuilt:
// the five located sentences have drifted once already from a second copy.
//
// **Located, not solved.** feedback.js judges the typed answer and says where
// it went rather than what it is, the learner gets a second attempt, and only
// a spent attempt or "Show me" reveals anything.
//
// Grading stays exactly as binary as srs.js is — no ease factors, no sixth
// box. What changed is the bar: **only a first-attempt correct answer
// promotes.** A right answer on the second go came after the app told the
// learner where to look, which is scaffolding rather than retrieval, and
// "Show me" is wrong by definition. An accent left off still counts as
// correct — that is a spelling slip, not a failed recall, and typedAnswer.js
// exists to say so.
//
// Built in the La Città design system, like Mappatura delle parole, the
// L'Officina hub and Gli Articoli. PLAN.md's open question 3 is the seam
// between that and the four older module interiors, and its answer is that a
// screen migrates when it is rebuilt, never in a blanket pass — so this
// screen moves and nothing else does.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// One spelling of the name and one copy of the blurb, taken from the tile on
// the map — a district and the door to it should not drift apart.
const PIAZZA = districtById("piazza");

// Which district an item came from, for the colour on its card. Resolved by
// districts.js rather than by a second table here, so a district that changes
// its accent changes this too, and so a bench that is not the module its
// district's tile counts still finds its walls — La Riserva sits inside
// L'Officina, whose tile counts the vocabulary deck. Every scheduled module
// resolves; ReviewModule.test.jsx pins that, which is why there is no "no
// district" branch to cover.

// The names are English because this line is English prose that marks no
// spans. "La Riserva" is Italian, so what goes here is what the bench is —
// the base vocabulary — and the district name beside it carries `lang="it"`
// where it is drawn.
const MODULE_LABEL = { vocab: "Vocabulary", grammar: "Grammar", riserva: "Base vocabulary", articoli: "Articles" };

function Eyebrow({ children, style }) {
  return (
    <span
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

function Screen({ children }) {
  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
      {children}
    </div>
  );
}

function BackLink({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: TOKENS.inkSoft,
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: SANS,
        fontSize: 13,
        padding: "6px 6px 6px 0",
      }}
    >
      <ArrowLeft size={16} aria-hidden="true" /> {label}
    </button>
  );
}

// `...rest` for the reason Verdict.jsx's Eyebrow takes it: the round hangs an
// aria-describedby off this button on an article item, and a signature that
// silently ate it would leave a keyboard learner told nothing, with no test
// going red and nothing for axe to see.
function PrimaryButton({ children, onClick, type = "button", style, ...rest }) {
  return (
    <button
      {...rest}
      type={type}
      onClick={onClick}
      style={{
        border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
        borderRadius: CITY_RULES.radius,
        boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
        background: CITY_ACCENTS.pistachio.fill,
        color: CITY_ACCENTS.pistachio.ink,
        padding: "13px 18px",
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// "Fammelo vedere" is a deliberate second choice in the design, so it is
// drawn as one: the same shape in a quieter voice, no accent fill and no
// shadow, sitting under the primary rather than beside it.
function SecondaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
        borderRadius: CITY_RULES.radius,
        background: "transparent",
        color: TOKENS.ink,
        padding: "11px 18px",
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        display: "block",
        width: "100%",
        marginTop: 10,
      }}
    >
      {children}
    </button>
  );
}

// ── The landing (design screen 18) ───────────────────────────────────────

// Screen 18 is a place rather than a jump straight into a session, so La
// Piazza gets a door: what is waiting, what the district is for, and one
// derived fact about the week. The card that fact goes in is *not* the
// design's warning card — see week.js for why that sentence would be false
// here and what replaced it.
function PiazzaHome({ progress, due, onStart, onExit }) {
  const solid = solidThisWeek(progress);

  return (
    <Screen>
      <BackLink label={<span lang="it">La Citt&agrave;</span>} onClick={onExit} />

      <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          The review district
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          {PIAZZA.name}
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "10px 0 0", lineHeight: 1.55 }}>
          {PIAZZA.blurb}
        </p>
      </div>

      <div style={{ ...citySurface("pistachio"), padding: "16px", marginBottom: 14, textAlign: "center" }}>
        <p style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 600, margin: 0, lineHeight: 1 }}>{due}</p>
        <Eyebrow style={{ opacity: 0.9 }}>{due === 1 ? "item waiting" : "items waiting"}</Eyebrow>
        {/* Both numbers or the one that is true. A round is capped at
            SESSION_LIMIT, so 47 waiting and a counter reading 1 / 20 was the
            landing quietly saying something the round then contradicted —
            the same unbacked figure week.js exists to refuse, on the screen
            that refuses it. */}
        {due > SESSION_LIMIT && (
          <p style={{ fontFamily: SANS, fontSize: 13, margin: "10px 0 0", lineHeight: 1.5, opacity: 0.9 }}>
            One round takes {SESSION_LIMIT} of them, most overdue first. The rest keep their place in the queue.
          </p>
        )}
      </div>

      {solid > 0 && (
        <div style={{ ...citySurface("lemon"), padding: "14px 16px", marginBottom: 14 }}>
          <Eyebrow style={{ opacity: 0.85 }}>The week ahead</Eyebrow>
          <p style={{ fontFamily: SANS, fontSize: 14, margin: "8px 0 0", lineHeight: 1.55 }}>
            <b>
              {solid} solid {solid === 1 ? "word comes" : "words come"} back
            </b>{" "}
            in the next {WEEK_DAYS} days — the ones on their longest gap.
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13, margin: "6px 0 0", lineHeight: 1.55, opacity: 0.9 }}>
            Nothing falls out of solid for being answered late. It is just their turn.
          </p>
        </div>
      )}

      {/* This card describes the round, so it has to keep describing the
          round. "You write the Italian rather than picking it out of a
          line-up" was true of every item until Gli Articoli joined the
          queue, and an article item is three buttons — so the sentence
          names its own exception rather than quietly becoming false, which
          is the same rule week.js applies to the card above it.

          One attempt count for both shapes, because the two judges keep
          their own: ReviewModule.test.jsx pins that they agree, so this
          sentence can state one number. */}
      <div style={{ ...citySurface(), padding: "14px 16px", marginBottom: 18 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>Produce &mdash; don&rsquo;t recognise</Eyebrow>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, margin: "8px 0 0", lineHeight: 1.55 }}>
          You write the Italian rather than picking it out of a line-up &mdash; everywhere except{" "}
          <span lang="it">Gli Articoli</span>, where the three forms <i>are</i> the question. Get one wrong and the app
          says <i>where</i> it went, then gives it back to you — you get {ATTEMPTS} goes before it tells you anything.
        </p>
      </div>

      <PrimaryButton onClick={onStart}>
        Start the round <ArrowRight size={16} aria-hidden="true" />
      </PrimaryButton>
    </Screen>
  );
}

// Reachable from a stale map, or by finishing a round and coming back.
function NothingDue({ onExit }) {
  return (
    <Screen>
      <BackLink label={<span lang="it">La Citt&agrave;</span>} onClick={onExit} />

      <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          The review district
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          {PIAZZA.name}
        </h1>
      </div>

      <div style={{ ...citySurface(), padding: "18px 16px", marginBottom: 18 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>Nothing due</Eyebrow>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, margin: "8px 0 0", lineHeight: 1.55 }}>
          Everything you have studied is scheduled for a later day. Answer something in{" "}
          <span lang="it">L&rsquo;Officina</span> or <span lang="it">Il Cantiere</span> and the first ones come back
          tomorrow.
        </p>
      </div>

      <PrimaryButton onClick={onExit}>Back to the city</PrimaryButton>
    </Screen>
  );
}

// ── The item (design screen 18, the lower half) ──────────────────────────

function Round({ queue, onGrade, onDone, onBack }) {
  const inputId = useId();
  const verdictId = useId();
  const inputRef = useRef(null);
  const firstOptionRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [tried, setTried] = useState([]);
  const [attempt, setAttempt] = useState(1);
  const [verdict, setVerdict] = useState(null);
  const [results, setResults] = useState([]);

  const { unit, q } = queue[index];
  const district = districtForModule(unit.moduleId);
  // Which of the two question shapes this is. The field rather than the module
  // id, because what the screen needs to know is how the item is answered, and
  // "it has a line-up" is exactly that — see question.js.
  const choice = q.options.length > 0;
  // Each judge keeps its own attempt count on purpose (feedback.js: hoisting
  // the 2 would couple two drills that have no reason to keep the same number
  // forever), so the counter reads the one that is judging this item.
  const attempts = choice ? ARTICLE_ATTEMPTS : ATTEMPTS;
  // A wrong first attempt is not the end of the item: the learner keeps the
  // located feedback and the input, or the buttons she has not spent. Only a
  // right answer, a spent last attempt or "Show me" closes it. Both judges
  // put the same two fields on a verdict, so this reads either.
  const settled = verdict !== null && (verdict.correct || verdict.last);

  // Focus follows the item. Everything else on this screen keeps its element
  // across a state change — the typed shape's one button is mounted whatever
  // the item is doing, and a spent option button is aria-disabled rather than
  // removed — but advancing replaces the whole item, and the article shape's
  // "Next" is the control being pressed *and* the one that unmounts. Without
  // this, that press drops focus to the body and a keyboard learner starts the
  // next item nowhere.
  //
  // The target is whatever the new item is answered with: the box for a typed
  // item, the first of the three for an article one. It runs on mount too,
  // which is right — the button that opened the round has just unmounted, so
  // focus was on the body there as well.
  useEffect(() => {
    (inputRef.current ?? firstOptionRef.current)?.focus();
  }, [index]);

  // The single grading point, and the reason the item can't be graded twice:
  // it is only ever called from a branch that also settles the item, and a
  // settled item's button advances rather than re-checking.
  const settle = (promoted) => {
    onGrade(unit.key, promoted);
    setResults((r) => [...r, { key: unit.key, promoted, recap: q.recap }]);
  };

  const advance = () => {
    if (index + 1 >= queue.length) {
      onDone(results);
      return;
    }
    setIndex(index + 1);
    setInput("");
    setTried([]);
    setAttempt(1);
    setVerdict(null);
  };

  // One button, whatever state a *typed* item is in — swapping a "Check"
  // button for a separate "Next" one would unmount the element the learner
  // just pressed and drop focus to the body, which is a keyboard user losing
  // their place every single answer.
  const submit = (event) => {
    event.preventDefault();
    if (settled) {
      advance();
      return;
    }

    const next = judge(q, input, attempt);
    setVerdict(next);

    if (next.correct || next.last) {
      // Only right first time promotes. A second-attempt correct answer came
      // after the app said where to look, and that is scaffolding.
      settle(next.correct && attempt === 1);
    } else {
      if (next.spent) setAttempt(attempt + 1);
      // Straight back into the field: the point of the second attempt is to
      // fix the word that is still sitting in it.
      inputRef.current.focus();
    }
  };

  // The article shape's answer. No form and no "Check": pressing a form *is*
  // the answer, so there is nothing left to submit. The promote rule is the
  // typed one to the character, and deliberately — with three buttons a
  // second-attempt win is worth even less than it is on a typed answer,
  // because the app has just ruled one of the three out.
  //
  // A spent option is not re-judged. It keeps its place in the tab order
  // (aria-disabled, not `disabled`, so it does not vanish out from under a
  // keyboard user mid-item), which means the press still arrives here.
  const choose = (option) => {
    if (settled || tried.includes(option)) return;

    const next = judgeArticle(unit.item, option, attempt);
    setVerdict(next);
    setTried([...tried, option]);
    if (next.correct || next.last) settle(next.correct && attempt === 1);
    else setAttempt(attempt + 1);
  };

  const showMe = () => {
    setVerdict(reveal(q));
    settle(false);
  };

  const buttonLabel = () => {
    if (settled) return index + 1 >= queue.length ? "See how it went" : "Next";
    return attempt === 1 ? "Check" : "Check again";
  };

  return (
    <Screen>
      {/* This line is "which level, which module", and how long that is
          depends entirely on the module: two characters for a CEFR rung,
          twenty for an article strand — "A1 · Vocabulary" against "The
          definite article · Articles".

          App.jsx fixes the menu and theme controls at top:16 right:16, two
          36px buttons and an 8px gap, so they own x 279–359 in the y 16–52
          band at 375px wide — and this row sits at y 30–45, inside it. The
          long labels ran straight under them: measured on this branch at
          375px, the articles' label reached x=352 and La Riserva's *already*
          reached 337 before this change. So the row reserves that zone and
          wraps instead, which drops a long label to its own line at the left
          margin where nothing is over it. Truncating was the other option and
          is worse: it would hide which strand the item came from. */}
      <div
        style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12, paddingRight: 80 }}
      >
        <BackLink label={<span lang="it">{PIAZZA.name}</span>} onClick={onBack} />
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: TOKENS.inkSoft, margin: 0, minWidth: 0 }}>
          {unit.level.label} · {MODULE_LABEL[unit.moduleId]}
        </p>
      </div>

      {/* Mounted for the life of the screen and empty until there is a
          verdict — see LiveStatus.jsx. A region that appears with its text
          already inside may never be announced at all. */}
      <LiveStatus>{verdict ? (choice ? announceArticle(verdict) : announce(verdict)) : ""}</LiveStatus>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          {index + 1} / {queue.length}
        </Eyebrow>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          Attempt {attempt} of {attempts}
        </Eyebrow>
      </div>

      <div style={{ ...citySurface(district.accent), padding: "14px 16px", marginBottom: 14 }}>
        <Eyebrow style={{ opacity: 0.85 }}>
          <span lang="it">{district.name}</span>
        </Eyebrow>

        {/* Vocabulary is asked by its English gloss; the example sentence
            underneath, with the word cut out of it, is what tells "well"
            from "good". Twelve of the 120 words can't be gapped without
            lemmatising them, and those get the gloss on its own rather than
            a wrong span cut out — see question.js. */}
        {q.gloss && (
          <p style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, margin: "6px 0 0", lineHeight: 1.25 }}>{q.gloss}</p>
        )}
        {/* A base-vocabulary word arrives with both glosses, because
            fondamentale.js carries both and PLAN.md's "Polish is a
            first-class layer" means the Polish half is not an afterthought
            to be dropped when the item leaves its own bench. It is a
            separate element rather than appended to the English string
            because it is a different language and has to say so (WCAG
            3.1.2). See modules/riserva/drill.js on why every sense is
            shown rather than one being picked. */}
        {q.glossPl && (
          <p lang="pl" style={{ fontFamily: SANS, fontSize: 15, margin: "8px 0 0", lineHeight: 1.5, opacity: 0.92 }}>
            {q.glossPl}
          </p>
        )}
        {q.cloze && (
          <p lang="it" style={{ fontFamily: SANS, fontSize: 15, margin: "10px 0 0", lineHeight: 1.5, opacity: 0.92 }}>
            {q.cloze}
          </p>
        )}

        {q.prompt && (
          <p lang="it" style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, margin: "6px 0 0", lineHeight: 1.3 }}>
            {q.prompt}
          </p>
        )}
        {q.hint && (
          <p style={{ fontFamily: SANS, fontSize: 13, margin: "10px 0 0", lineHeight: 1.5, opacity: 0.92 }}>{q.hint}</p>
        )}
      </div>

      {/* ── The article shape ─────────────────────────────────────────────
          Three buttons instead of a box, the strand's own judge, and the
          strand's own cards underneath. The rule and the Polish anchor come
          with the item rather than staying behind on the bench, for the same
          reason La Riserva's Polish gloss travels: PLAN.md's "Polish is a
          first-class layer" is not a property of one screen.

          No "Show me". It is the typed shape's escape hatch from a blank
          page, and there is no blank page here — three buttons are always
          pressable, and pressing two of them reveals the answer anyway. */}
      {choice ? (
        <>
          <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 2px" }}>
            Fill the gap. One of the three is right.
          </p>

          <Options
            options={q.options}
            answer={q.answer}
            tried={tried}
            settled={settled}
            onChoose={choose}
            firstRef={firstOptionRef}
          />

          {verdict && <ArticleVerdict id={verdictId} verdict={verdict} />}
          {verdict?.rule && (
            <div style={{ marginTop: 14 }}>
              <Rule rule={verdict.rule} />
            </div>
          )}
          {verdict?.anchor && <PolishAnchor anchor={verdict.anchor} />}

          {/* Mounted only once the item settles, because until then there is
              nothing to carry forward — and the focus effect above is what
              catches the press that unmounts it. It describes itself with the
              verdict card, so a keyboard learner who lands here is told where
              the answer went rather than only that it went, which is the same
              thing the typed shape does with its input. */}
          {settled && (
            <PrimaryButton onClick={advance} aria-describedby={verdictId} style={{ marginTop: 14 }}>
              {buttonLabel()} <ArrowRight size={16} aria-hidden="true" />
            </PrimaryButton>
          )}
        </>
      ) : (
      <form onSubmit={submit}>
        <label htmlFor={inputId} style={{ display: "block", fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, marginBottom: 6 }}>
          Write it in Italian
        </label>
        {/* aria-invalid marks something the learner wrote that is wrong, so
            it follows answered() rather than "not correct": a blank box and a
            reveal are verdicts about an empty field, and calling that field
            invalid is telling a screen reader she got something wrong when
            she typed nothing. aria-describedby hangs the verdict card off the
            field, so returning to the input after a wrong answer reads back
            where it went and not just that it went. */}
        <input
          id={inputId}
          ref={inputRef}
          lang="it"
          value={input}
          readOnly={settled}
          onChange={(e) => setInput(e.target.value)}
          aria-invalid={verdict !== null && !verdict.correct && answered(verdict) ? "true" : undefined}
          aria-describedby={verdict !== null ? verdictId : undefined}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: SERIF,
            fontSize: 20,
            fontWeight: 600,
            color: TOKENS.ink,
            background: TOKENS.card,
            border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
            borderRadius: CITY_RULES.radius,
            padding: "12px 14px",
          }}
        />

        {verdict && <Verdict id={verdictId} context={q.context} verdict={verdict} />}

        <PrimaryButton type="submit" style={{ marginTop: 14 }}>
          {buttonLabel()} <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>
      </form>
      )}

      {!choice && !settled && <SecondaryButton onClick={showMe}>Show me</SecondaryButton>}
    </Screen>
  );
}

// ── The end of a round ───────────────────────────────────────────────────

function Summary({ results, onBack }) {
  const promoted = results.filter((r) => r.promoted);
  const again = results.filter((r) => !r.promoted);

  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <RefreshCw size={30} color={TOKENS.ink} aria-hidden="true" />
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: TOKENS.ink, margin: "8px 0 0" }}>
          That&rsquo;s the round
        </h1>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ ...citySurface("pistachio"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{promoted.length}</p>
          <Eyebrow style={{ opacity: 0.9 }}>right first time</Eyebrow>
        </div>
        <div style={{ ...citySurface("lemon"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{again.length}</p>
          <Eyebrow style={{ opacity: 0.9 }}>coming back</Eyebrow>
        </div>
      </div>

      {again.length > 0 && (
        <div style={{ ...citySurface(), padding: "14px 16px", marginBottom: 20 }}>
          <Eyebrow style={{ color: TOKENS.inkSoft }}>Worth another look</Eyebrow>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
            {again.map(({ key, recap }) => (
              <li key={key} style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, lineHeight: 1.45 }}>
                <b lang="it">{recap.primary}</b>
                <span style={{ color: TOKENS.inkSoft }}> &middot; {recap.secondary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* One flex child, not two: the button lays its children out with a
          gap, so "Back to" and the name would come out two spaces apart. */}
      <PrimaryButton onClick={onBack}>
        <span>
          Back to <span lang="it">{PIAZZA.name}</span>
        </span>
      </PrimaryButton>
    </Screen>
  );
}

// onExit returns to the city map (see src/App.jsx). Review is a route rather
// than a MODULES entry: it has no content and no progress of its own, it
// replays other districts'.
export default function ReviewModule({ onExit }) {
  const [progress, setProgress] = useState(loadProgress);
  const [round, setRound] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Built once, when the round starts, from storage as it is at that moment —
  // answering must not reshuffle the queue underneath you, and the landing
  // screen may have been open a while.
  const start = () => {
    setResults(null);
    setRound(dueItems(loadProgress(), todayISO()).map((unit) => ({ unit, q: toQuestion(unit) })));
  };

  const backToHome = () => {
    setRound(null);
    setResults(null);
  };

  if (results !== null) {
    return <Summary results={results} onBack={backToHome} />;
  }

  if (round !== null) {
    return (
      <Round
        queue={round}
        onBack={backToHome}
        onGrade={(key, correct) => setProgress((p) => reviewItem(p, key, correct))}
        onDone={setResults}
      />
    );
  }

  const due = dueCount(progress);
  if (due === 0) return <NothingDue onExit={onExit} />;

  return <PiazzaHome progress={progress} due={due} onStart={start} onExit={onExit} />;
}
