import { describe, expect, test } from "bun:test";
import {
  composeStructuredAnswer,
  parseStructuredAnswer,
} from "./structuredAnswer";

const rootFields = [
  { key: "x1", label: "x_1", placeholder: "-3" },
  { key: "x2", label: "x_2", placeholder: "4" },
];

describe("structured answer helpers", () => {
  test("composes structured field values into a normal final answer", () => {
    expect(
      composeStructuredAnswer(rootFields, { x1: "-3", x2: "4" }),
    ).toBe("x_1 = -3, x_2 = 4");
  });

  test("parses labelled generated solutions back into fields", () => {
    expect(parseStructuredAnswer("$x_1 = -3, x_2 = 4$", rootFields)).toEqual({
      x1: "-3",
      x2: "4",
    });
  });

  test("parses not-equal parameter fields", () => {
    const fields = [{ key: "k", label: "k", operator: "!=", placeholder: "3" }];

    expect(parseStructuredAnswer("$k \\neq 3$", fields)).toEqual({ k: "3" });
  });
});
