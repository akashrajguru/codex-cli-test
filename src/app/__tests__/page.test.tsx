import { render, screen } from "@testing-library/react";

import Home from "../page";

describe("Home page", () => {
  it("renders the onboarding headline", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /to get started, edit the page\.tsx file/i,
      })
    ).toBeInTheDocument();
  });
});
