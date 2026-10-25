import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";

/** Render di dalam router memori; `NavLink`/`Link` butuh konteks router. */
export const renderWithRouter = (ui: ReactElement, { path = "/" } = {}) =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
