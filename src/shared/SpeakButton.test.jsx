import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SpeakButton from "./SpeakButton.jsx";
import * as speech from "./speech.js";

describe("SpeakButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when speech isn't supported", () => {
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(false);
    const { container } = render(<SpeakButton text="ciao" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("speaks the given text when clicked", async () => {
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
    const speakSpy = vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
    const user = userEvent.setup();

    render(<SpeakButton text="ciao" />);
    await user.click(screen.getByRole("button", { name: 'Pronounce "ciao"' }));

    expect(speakSpy).toHaveBeenCalledWith("ciao");
  });

  it("does not trigger a click handler on an ancestor element", async () => {
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
    vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
    const parentClick = vi.fn();
    const user = userEvent.setup();

    render(
      <div onClick={parentClick}>
        <SpeakButton text="ciao" />
      </div>
    );
    await user.click(screen.getByRole("button", { name: 'Pronounce "ciao"' }));

    expect(parentClick).not.toHaveBeenCalled();
  });
});
