import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Postmark from "./Postmark.jsx";
import { LEVEL_ACCENTS, TOKENS, CITY_RULES } from "./theme.js";

describe("Postmark", () => {
  it("stamps the level onto the badge", () => {
    render(<Postmark level="B1" accentDeep={LEVEL_ACCENTS.B1.accentDeep} />);

    expect(screen.getByText("B1")).toBeInTheDocument();
    expect(screen.getByText("ITALIANO")).toBeInTheDocument();
  });

  it("takes its color from the level accent it's handed", () => {
    render(<Postmark level="A1" accentDeep={LEVEL_ACCENTS.A1.accentDeep} />);

    expect(screen.getByText("A1")).toHaveStyle({ color: LEVEL_ACCENTS.A1.accentDeep });
  });

  it("rings the stamp with the city's 3px rule and hard shadow, in accentDeep", () => {
    const { container } = render(<Postmark level="B2" accentDeep={LEVEL_ACCENTS.B2.accentDeep} />);

    expect(container.firstChild.style.border).toBe(`${CITY_RULES.border}px solid ${LEVEL_ACCENTS.B2.accentDeep}`);
    expect(container.firstChild.style.boxShadow).toBe(`${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`);
  });
});
