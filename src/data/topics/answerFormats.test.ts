import { describe, expect, test } from "bun:test";
import { getAnswerFormat } from "./index";

describe("answer formats", () => {
  test("quadratic equations guide students toward set notation", () => {
    const format = getAnswerFormat("quadratic_equations");

    expect(format.placeholder).toContain("{");
    expect(format.instruction).toContain("set of roots");
    expect(format.alternatives).toContain("{-3, 4}");
    expect(format.fields?.map((field) => field.key)).toEqual(["x1", "x2"]);
  });

  test("generated problem answer format overrides defaults", () => {
    const generated = {
      answerFormat: {
        placeholder: "Example: custom",
        instruction: "Use the custom shape.",
      },
    };

    expect(getAnswerFormat("quadratic_equations", generated)).toEqual(
      generated.answerFormat,
    );
  });

  test("unknown topics still receive a safe generic format", () => {
    expect(getAnswerFormat("unknown_topic").instruction).toContain(
      "standard mathematical notation",
    );
  });
});
