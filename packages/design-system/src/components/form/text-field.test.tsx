import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TextField } from "./text-field";

describe(TextField, () => {
  afterEach(cleanup);

  it("links the label and description to the input", () => {
    render(<TextField description="Kami tidak membagikannya." label="Email" />);
    const input = screen.getByLabelText("Email");
    const description = screen.getByText("Kami tidak membagikannya.");
    expect(description.id).toBeTruthy();
    expect(input.getAttribute("aria-describedby")).toBe(description.id);
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("marks the input invalid and announces the error", () => {
    render(
      <TextField errors={[{ message: "Email tidak valid" }]} label="Email" />
    );
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("Email tidak valid");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
  });

  it("ignores empty error entries", () => {
    render(<TextField errors={[undefined]} label="Nama" />);
    expect(
      screen.getByLabelText("Nama").getAttribute("aria-invalid")
    ).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps a custom id for the control", () => {
    render(<TextField id="email" label="Email" />);
    expect(screen.getByLabelText("Email").id).toBe("email");
  });
});
