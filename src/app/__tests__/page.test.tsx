import { act, fireEvent, render, screen } from "@testing-library/react";

import Home from "../page";

describe("Home page", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("renders the jump hint", () => {
    render(<Home />);

    expect(
      screen.getByLabelText(/game arena\. tap or press space to jump\./i)
    ).toBeInTheDocument();

    expect(screen.getByText(/press space to start/i)).toBeInTheDocument();
  });

  it("moves the player up and lands after a jump", () => {
    render(<Home />);

    const player = screen.getByTestId("player");
    expect(player).toHaveStyle({ transform: "translateY(0px)" });

    fireEvent.keyDown(window, { code: "Space" });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(player.style.transform).not.toBe("translateY(0px)");
    expect(screen.queryByText(/press space to start/i)).toBeNull();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(player).toHaveStyle({ transform: "translateY(0px)" });
  });

  it("spawns obstacles over time after the run starts", () => {
    render(<Home />);

    fireEvent.keyDown(window, { code: "Space" });
    act(() => {
      jest.advanceTimersByTime(1300);
    });

    expect(screen.getAllByTestId("obstacle").length).toBeGreaterThan(0);
  });

  it("ends the run when an obstacle reaches the player", () => {
    render(<Home />);

    fireEvent.keyDown(window, { code: "Space" });
    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(
      screen.getByRole("button", { name: /restart/i })
    ).toBeInTheDocument();
  });

  it("increments the score only after the run starts", () => {
    render(<Home />);

    const score = screen.getByText(/score/i);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(score.textContent).toMatch(/score 0/i);

    fireEvent.keyDown(window, { code: "Space" });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(score.textContent).not.toMatch(/score 0/i);
  });

  it("ramps difficulty as the score increases", () => {
    render(<Home />);

    fireEvent.keyDown(window, { code: "Space" });

    act(() => {
      jest.advanceTimersByTime(1900);
    });

    const obstaclesBefore = screen.getAllByTestId("obstacle").length;

    act(() => {
      jest.advanceTimersByTime(2200);
    });

    const obstaclesAfter = screen.getAllByTestId("obstacle").length;
    expect(obstaclesAfter).toBeGreaterThanOrEqual(obstaclesBefore);
  });

  it("shows the difficulty tier as it ramps", () => {
    render(<Home />);

    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByText(/tier 1/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/tier 2/i)).toBeInTheDocument();
  });
});
