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

  it("pulses the tier badge when difficulty increases", () => {
    render(<Home />);

    fireEvent.keyDown(window, { code: "Space" });

    const tierStart = screen.getByTestId("tier");
    expect(tierStart.className).not.toMatch(/tier-pulse/);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const tier = screen.getByTestId("tier");
    expect(tier.className).toMatch(/tier-pulse/);
  });

  it("toggles between day and night as the score climbs", () => {
    render(<Home />);

    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByTestId("sun")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(screen.getByTestId("moon")).toBeInTheDocument();
  });

  it("shifts the ground colors at night", () => {
    render(<Home />);

    fireEvent.keyDown(window, { code: "Space" });

    const ground = screen.getByTestId("ground");
    expect(ground.className).toMatch(/amber/);

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(ground.className).toMatch(/slate/);
  });

  it("shows stars at night", () => {
    render(<Home />);

    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.queryAllByTestId("star")).toHaveLength(0);

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    const stars = screen.getAllByTestId("star");
    expect(stars.length).toBeGreaterThanOrEqual(10);
    expect(stars[0].className).toMatch(/star-twinkle/);
    expect(stars.some((star) => star.className.includes("star-glow"))).toBe(
      true
    );
  });

  it("renders a drifting haze layer", () => {
    render(<Home />);

    const hazeLayers = screen.getAllByTestId("haze");
    expect(hazeLayers[0].className).toMatch(/haze-drift/);
    expect(hazeLayers[1].className).toMatch(/haze-drift-slow/);
  });
});
