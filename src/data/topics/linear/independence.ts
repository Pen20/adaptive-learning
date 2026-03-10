export const independenceLogic = {
    generate: () => {
      // Generate two random vectors u and v.
      // Ensure they are not multiples of each other.
      
      const v_min = -3; // Reduce range slightly for simpler numbers
      const v_max = 3;
  
      const u = Array.from({ length: 3 }, () => Math.floor(Math.random() * (v_max - v_min + 1)) + v_min);
      let v = Array.from({ length: 3 }, () => Math.floor(Math.random() * (v_max - v_min + 1)) + v_min);
  
      const isZero = (vec: number[]) => vec.every(x => x === 0);
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
  
      while (isZero(u) || isZero(v) || areParallel(u, v)) {
         v = Array.from({ length: 3 }, () => Math.floor(Math.random() * (v_max - v_min + 1)) + v_min);
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
\\mathbf{u} \\times \\mathbf{v} &= \\mathbf{e}_1 (${u[1]} \\cdot ${v[2]} - ${u[2]} \\cdot ${v[1]}) - \\mathbf{e}_2 (${u[0]} \\cdot ${v[2]} - ${u[2]} \\cdot ${v[0]}) \\\\
&+ \\mathbf{e}_3 (${u[0]} \\cdot ${v[1]} - ${u[1]} \\cdot ${v[0]})
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
