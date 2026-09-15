import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AnswerStatus from "./AnswerStatus.jsx";

// The spoken half of answer feedback. The region has to stay mounted and
// empty before an answer (LiveStatus's own rule, checked in its test), and
// the answer inside it has to carry its own language — the sentence around
// it is English and the answer often is not.
describe("AnswerStatus", () => {
  it("says nothing at all until the question is answered", () => {
    const { container } = render(<AnswerStatus correct={null} answer="parlo" />);

    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    expect(container.querySelector('[role="status"]').textContent).toBe("");
  });

  it("treats an undefined result the same as an unanswered one", () => {
    const { container } = render(<AnswerStatus answer="parlo" />);

    expect(container.querySelector('[role="status"]').textContent).toBe("");
  });

  it("announces a correct answer without repeating it", () => {
    render(<AnswerStatus correct answer="parlo" />);

    expect(screen.getByRole("status")).toHaveTextContent("Correct.");
  });

  // The defect this guards: the whole announcement used to be one template
  // literal, so an Italian answer was read with English phonetics (SC
  // 3.1.2). `lang` marks elements, so the answer has to be its own element.
  it("marks an Italian answer as Italian, without marking the English around it", () => {
    render(<AnswerStatus correct={false} answer="parlo" answerLang="it" />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Not quite. The answer is parlo.");
    expect(status).not.toHaveAttribute("lang");

    const marked = screen.getByText("parlo");
    expect(marked).toHaveAttribute("lang", "it");
  });

  // The vocabulary quiz answers with an English gloss, so a default of "it"
  // would mispronounce every one of them. No prop means no attribute, which
  // inherits the page's language — the correct markup for English.
  it("leaves the attribute off when the caller names no language", () => {
    render(<AnswerStatus correct={false} answer="to speak" />);

    expect(screen.getByRole("status")).toHaveTextContent("Not quite. The answer is to speak.");
    expect(screen.getByText("to speak")).not.toHaveAttribute("lang");
  });
});
