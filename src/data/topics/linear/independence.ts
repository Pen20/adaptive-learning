import { paren } from "../format";

export const independenceLogic = {
    generate: () => {
      // Generate two random vectors u and v.
      // Ensure they are not multiples of each other.
      
      const v_min = -3; // Reduce range slightly for simpler numbers
      const v_max = 3;
  
      const randomVector = () =>
        Array.from({ length: 3 }, () => Math.floor(Math.random() * (v_max - v_min + 1)) + v_min);

      const isZero = (vec: number[]) => vec.every(x => x === 0);

      // A zero u would make u x v = 0, and the zero vector can never complete a
      // linearly independent set — the exercise and its official answer would
      // both be wrong. Only v is resampled below, so guard u here.
      let u: number[] = randomVector();
      while (isZero(u)) u = randomVector();
      let v = randomVector();
      const areParallel = (v1: number[], v2: number[]) => {
          if (isZero(v1) || isZero(v2)) return true;
          // Find first non-zero ratio
          let r: number | null = null;
          for(let i=0; i<3; i++) {
              if (v2[i] !== 0) {
                  if (v1[i] === 0) return false; 
                  const currentR = v1[i] / v2[i];
                  if (r === null) r = currentR;
                  else if (Math.abs(r - currentR) > 0.001) return false;
              } else if (v1[i] !== 0) {
                  return false;
              }
          }
          return true;
      }
  
      let attempts = 0;
      while (isZero(v) || areParallel(u, v)) {
        v = randomVector();
        if (++attempts > 50) {
          // Deterministic fallback: some standard basis vector is always
          // non-parallel to a non-zero u (u is parallel to at most one of them).
          v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].find((e) => !areParallel(u, e))!;
          break;
        }
      }
  
      // Calculate Cross Product: n = u x v
      const n = [
          u[1] * v[2] - u[2] * v[1],
          u[2] * v[0] - u[0] * v[2],
          u[0] * v[1] - u[1] * v[0]
      ];
  
      const u_latex = `\\begin{bmatrix} ${u[0]} \\\\ ${u[1]} \\\\ ${u[2]} \\end{bmatrix}`;
      const v_latex = `\\begin{bmatrix} ${v[0]} \\\\ ${v[1]} \\\\ ${v[2]} \\end{bmatrix}`;
      const n_latex = `\\begin{bmatrix} ${n[0]} \\\\ ${n[1]} \\\\ ${n[2]} \\end{bmatrix}`;
  
      return {
        title: "Linear Independence",
        statement: `You are given the vectors:
$$
\\mathbf{u} = ${u_latex}, \\quad \\mathbf{v} = ${v_latex}.
$$
Find a third vector $\\mathbf{w}$ so that $\\{\\mathbf{u}, \\mathbf{v}, \\mathbf{w}\\}$ form a linearly independent set.`,
        prompt: "\\mathbf{w} =",
        solution: `$\\text{Any vector } \\mathbf{w} \\notin \\text{span}(\\mathbf{u}, \\mathbf{v}). \\text{ A guaranteed answer is } \\mathbf{w =} \\mathbf{u} \\times \\mathbf{v}.$`,
        explanation: `To find a vector $\\mathbf{w}$ such that the set $\\{\\mathbf{u}, \\mathbf{v}, \\mathbf{w}\\}$ is linearly independent, we need a vector that does not lie in the plane spanned by $\\mathbf{u}$ and $\\mathbf{v}$.
  
A reliable method is to calculate the cross product $\\mathbf{w} = \\mathbf{u} \\times \\mathbf{v}$, which produces a vector orthogonal (perpendicular) to both $\\mathbf{u}$ and $\\mathbf{v}$. Since it is orthogonal, it clearly does not lie in their plane.
  
Calculation:
$$
\\mathbf{u} \\times \\mathbf{v} = \\begin{vmatrix} 
\\mathbf{e}_1 & \\mathbf{e}_2 & \\mathbf{e}_3 \\\\
${u[0]} & ${u[1]} & ${u[2]} \\\\
${v[0]} & ${v[1]} & ${v[2]} 
\\end{vmatrix}
$$
  
Expanding the determinant:
$$
\\begin{aligned}
\\mathbf{u} \\times \\mathbf{v} &= \\mathbf{e}_1 (${paren(u[1])} \\cdot ${paren(v[2])} - ${paren(u[2])} \\cdot ${paren(v[1])}) - \\mathbf{e}_2 (${paren(u[0])} \\cdot ${paren(v[2])} - ${paren(u[2])} \\cdot ${paren(v[0])}) \\\\
&+ \\mathbf{e}_3 (${paren(u[0])} \\cdot ${paren(v[1])} - ${paren(u[1])} \\cdot ${paren(v[0])})
\\end{aligned}
$$
  
$$
\\begin{aligned}
&= \\begin{bmatrix} 
(${u[1]})(${v[2]}) - (${u[2]})(${v[1]}) \\\\ 
-((${u[0]})(${v[2]}) - (${u[2]})(${v[0]})) \\\\ 
(${u[0]})(${v[1]}) - (${u[1]})(${v[0]})
\\end{bmatrix} \\\\
&= \\begin{bmatrix} 
${n[0]} \\\\ 
${n[1]} \\\\ 
${n[2]}
\\end{bmatrix}
\\end{aligned}
$$
  
Thus, one possible solution is $\\mathbf{w} = ${n_latex}$. Any non-zero scalar multiple of this vector is also a valid independent choice.`,
        hint: "Calculate the cross product of u and v. The resulting vector is guaranteed to be linearly independent of both.",
        reasoningSteps: `Step 1 — Understand the requirement: w must not lie in span(u, v), i.e. {u, v, w} must be linearly independent — the 3×3 matrix [u | v | w] must have non-zero determinant.
Step 2 — Choose the cross product method: w = u × v is orthogonal to both u and v and therefore cannot lie in their plane. This guarantees independence without needing to check the determinant explicitly.
Step 3 — Compute the cross product via the 3×3 determinant with unit vectors e₁, e₂, e₃ in the first row: expand along row 1 to get the three components of w.
Step 4 — State w = [n₁, n₂, n₃]. Any non-zero scalar multiple is equally valid.
Step 5 — (Optional) Verify: det([u | v | w]) ≠ 0 confirms linear independence.`,
        guide: {
          title: "Linear Independence Strategy",
          content: `
- Cross Product Method: In $\\mathbb{R}^3$, the cross product $\\mathbf{u} \\times \\mathbf{v}$ yields a vector orthogonal to the span of $\\mathbf{u}$ and $\\mathbf{v}$, ensuring independence.
- Independence Check: $\\det(\\mathbf{u}, \\mathbf{v}, \\mathbf{w}) \\neq 0$.
          `
        }
      };
    }
  };
