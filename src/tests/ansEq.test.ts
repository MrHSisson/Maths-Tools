import { describe, it, expect } from "vitest";
import { ansEq } from "../shared/helpers";

describe("ansEq", () => {
  it("puts '= ' in front of a plain answer", () => {
    expect(ansEq("12")).toBe("= 12");
    expect(ansEq("(3, 4)")).toBe("= (3, 4)");        // a coordinate pair is a plain answer, not lettered parts
    expect(ansEq("(a+b)")).toBe("= (a+b)");
  });
  it("leaves an answer that already has an equals sign or a blank", () => {
    expect(ansEq("x = 5")).toBe("x = 5");
    expect(ansEq("\\underline{5}")).toBe("\\underline{5}");
  });
  it("leaves an answer made of lettered parts as it is", () => {
    expect(ansEq("(a) 0.6, (b) −0.6")).toBe("(a) 0.6, (b) −0.6");
    expect(ansEq("\\begin{array}{ll}(a) 0.6 & (b) -0.6\\end{array}")).toBe("\\begin{array}{ll}(a) 0.6 & (b) -0.6\\end{array}");   // a table of parts
  });
});
