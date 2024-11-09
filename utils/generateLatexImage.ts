const mjAPI = require("mathjax-node");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

mjAPI.config({
    MathJax: {
      TeX: {
        macros: {
          minus: '-',
          R: "\\mathbb{R}",
          Z: "\\mathbb{Z}",
          N: "\\mathbb{N}",
          Q: "\\mathbb{Q}",
          C: "\\mathbb{C}",
          P: "\\mathbb{P}",
          E: "\\mathbb{E}",
          prob: ["\\Pr\\left( #1 \\right)", 1],
          exp: "\\mathrm{e}^{#1}", 
          vec: ["{\\mathbf{#1}}", 1],
          dotp: ["{\\mathbf{#1} \\cdot \\mathbf{#2}}", 2],
          cross: ["{\\mathbf{#1} \\times \\mathbf{#2}}", 2],
          grad: "\\nabla",
          div: "\\nabla \\cdot ",
          curl: "\\nabla \\times ",
          abs: ["{\\left| #1 \\right|}", 1],
          norm: ["{\\left\\lVert #1 \\right\\rVert}", 1],
          avg: ["{\\langle #1 \\rangle}", 1],
          real: "\\Re",
          imag: "\\Im",
          suminf: "\\sum_{n=0}^{\\infty}",
          liminf: "\\lim_{n \\to \\infty}",
          limsup: "\\limsup_{n \\to \\infty}",
          argmax: "\\mathrm{arg\\,max}",
          argmin: "\\mathrm{arg\\,min}"
        },
        extensions: ["AMSmath.js", "AMSsymbols.js", "noUndefined.js"],
        packages: { "[+]": ["base", "ams", "amscd", "color", "autobold", "bbox", "physics", "braket"] }
      },
      SVG: {
        scale: 1.2,
        font: "TeX",
        linebreaks: { automatic: true },
        useGlobalCache: false
      }
    }
  });
mjAPI.start();

const generateImage = (latexQuery: string) => {

    const dirPath = path.join(__dirname, '..', 'generatedLaTeX_Responses');
    const outputPath = path.join(dirPath, `${Date.now()}.png`);

    return new Promise((resolve, reject) => {        
        // First, we ensure the directory exists.
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }

        // Use MathJax API to generate SVG from LaTeX
        mjAPI.typeset({
            math: latexQuery,
            format: "TeX",
            svg: true
        }, (data: any) => { //TODO: Fix any type here!

            if (data.errors) reject(data.errors);

            if (!data.svg) {
                reject(new Error('Failed to generate SVG'));
                return;
            }

            const svgBuffer = Buffer.from(data.svg);
            sharp(svgBuffer)
            .png({ quality: 80 })
            .resize(1024, 800)
            .toFile(outputPath, (err: Error , info:any) => { //TODO: Fix any type here!
                if (err) reject(new Error(`Sharp Error: ${err.message}`));
                resolve(outputPath);
            });

        });

    });

}

module.exports = {generateImage};