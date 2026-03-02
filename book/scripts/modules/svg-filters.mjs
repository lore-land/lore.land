export function injectSvgFilters(document) {
    if (document.getElementById('spw-svg-filters')) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.id = "spw-svg-filters";
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.setAttribute("aria-hidden", "true");

    // Filter 1: Torn Paper Edge (spw-paper-edge)
    const filterPaper = document.createElementNS(svgNS, "filter");
    filterPaper.id = "spw-paper-edge";

    const turbulence = document.createElementNS(svgNS, "feTurbulence");
    turbulence.setAttribute("type", "fractalNoise");
    turbulence.setAttribute("baseFrequency", "0.04 0.08");
    turbulence.setAttribute("numOctaves", "3");
    turbulence.setAttribute("result", "noise");

    const displacementMap = document.createElementNS(svgNS, "feDisplacementMap");
    displacementMap.setAttribute("in", "SourceGraphic");
    displacementMap.setAttribute("in2", "noise");
    displacementMap.setAttribute("scale", "4");
    displacementMap.setAttribute("xChannelSelector", "R");
    displacementMap.setAttribute("yChannelSelector", "G");

    filterPaper.appendChild(turbulence);
    filterPaper.appendChild(displacementMap);

    // Filter 2: Celestial Glow (spw-celestial-glow)
    const filterGlow = document.createElementNS(svgNS, "filter");
    filterGlow.id = "spw-celestial-glow";

    const blur = document.createElementNS(svgNS, "feGaussianBlur");
    blur.setAttribute("in", "SourceAlpha");
    blur.setAttribute("stdDeviation", "4");
    blur.setAttribute("result", "blur");

    const colorMatrix = document.createElementNS(svgNS, "feColorMatrix");
    colorMatrix.setAttribute("type", "matrix");
    // Tealy-gold celestial glow mapping
    colorMatrix.setAttribute("values", "0 0 0 0 0.16   0 0 0 0 0.43   0 0 0 0 0.50   0 0 0 1 0");
    colorMatrix.setAttribute("result", "coloredBlur");

    const merge = document.createElementNS(svgNS, "feMerge");
    const mergeNode1 = document.createElementNS(svgNS, "feMergeNode");
    mergeNode1.setAttribute("in", "coloredBlur");
    const mergeNode2 = document.createElementNS(svgNS, "feMergeNode");
    mergeNode2.setAttribute("in", "SourceGraphic");
    merge.appendChild(mergeNode1);
    merge.appendChild(mergeNode2);

    filterGlow.appendChild(blur);
    filterGlow.appendChild(colorMatrix);
    filterGlow.appendChild(merge);

    svg.appendChild(filterPaper);
    svg.appendChild(filterGlow);

    document.body.prepend(svg);
}
