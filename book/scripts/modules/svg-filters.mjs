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

    // Filter 3: Textured Typography Grain (spw-text-grain)
    const filterTextGrain = document.createElementNS(svgNS, "filter");
    filterTextGrain.id = "spw-text-grain";

    const textTurbulence = document.createElementNS(svgNS, "feTurbulence");
    textTurbulence.setAttribute("type", "fractalNoise");
    textTurbulence.setAttribute("baseFrequency", "0.75");
    textTurbulence.setAttribute("numOctaves", "3");
    textTurbulence.setAttribute("result", "noise");

    const colorNoise = document.createElementNS(svgNS, "feColorMatrix");
    colorNoise.setAttribute("type", "matrix");
    // Grayscale noise, very dark
    colorNoise.setAttribute("values", "0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   1 0 0 0 0");
    colorNoise.setAttribute("in", "noise");
    colorNoise.setAttribute("result", "coloredNoise");

    const compositeAtop = document.createElementNS(svgNS, "feComposite");
    compositeAtop.setAttribute("operator", "in");
    compositeAtop.setAttribute("in", "coloredNoise");
    compositeAtop.setAttribute("in2", "SourceGraphic");
    compositeAtop.setAttribute("result", "texturedAlpha");

    const blendScreen = document.createElementNS(svgNS, "feBlend");
    blendScreen.setAttribute("mode", "multiply");
    blendScreen.setAttribute("in", "texturedAlpha");
    blendScreen.setAttribute("in2", "SourceGraphic");

    filterTextGrain.appendChild(textTurbulence);
    filterTextGrain.appendChild(colorNoise);
    filterTextGrain.appendChild(compositeAtop);
    filterTextGrain.appendChild(blendScreen);

    // Filter 4: Active Ripple (spw-active-ripple)
    const filterRipple = document.createElementNS(svgNS, "filter");
    filterRipple.id = "spw-active-ripple";

    const rippleTurbulence = document.createElementNS(svgNS, "feTurbulence");
    rippleTurbulence.setAttribute("type", "fractalNoise");
    rippleTurbulence.setAttribute("baseFrequency", "0.1");
    rippleTurbulence.setAttribute("numOctaves", "2");
    rippleTurbulence.setAttribute("result", "noise");

    const rippleDisplacement = document.createElementNS(svgNS, "feDisplacementMap");
    rippleDisplacement.setAttribute("in", "SourceGraphic");
    rippleDisplacement.setAttribute("in2", "noise");
    rippleDisplacement.setAttribute("scale", "2");
    rippleDisplacement.setAttribute("xChannelSelector", "R");
    rippleDisplacement.setAttribute("yChannelSelector", "G");
    rippleDisplacement.setAttribute("result", "displaced");

    // Create an inner shadow effect for indentation
    const dropShadow = document.createElementNS(svgNS, "feDropShadow");
    dropShadow.setAttribute("in", "displaced");
    dropShadow.setAttribute("dx", "0");
    dropShadow.setAttribute("dy", "1");
    dropShadow.setAttribute("stdDeviation", "2");
    dropShadow.setAttribute("flood-color", "#142036");
    dropShadow.setAttribute("flood-opacity", "0.6");

    filterRipple.appendChild(rippleTurbulence);
    filterRipple.appendChild(rippleDisplacement);
    filterRipple.appendChild(dropShadow);

    // Filter 5: Atmospheric Halo (spw-atmospheric-halo)
    const filterHalo = document.createElementNS(svgNS, "filter");
    filterHalo.id = "spw-atmospheric-halo";
    // Increase filter bounds to allow large glow
    filterHalo.setAttribute("x", "-20%");
    filterHalo.setAttribute("y", "-20%");
    filterHalo.setAttribute("width", "140%");
    filterHalo.setAttribute("height", "140%");

    const haloBlur = document.createElementNS(svgNS, "feGaussianBlur");
    haloBlur.setAttribute("in", "SourceAlpha");
    haloBlur.setAttribute("stdDeviation", "8");
    haloBlur.setAttribute("result", "blur");

    const haloColorMatrix = document.createElementNS(svgNS, "feColorMatrix");
    haloColorMatrix.setAttribute("type", "matrix");
    // Burnt orange / rustic red aura
    haloColorMatrix.setAttribute("values", "0 0 0 0 0.75   0 0 0 0 0.37   0 0 0 0 0.08   0 0 0 0.8 0");
    haloColorMatrix.setAttribute("result", "coloredBlur");

    const haloMerge = document.createElementNS(svgNS, "feMerge");
    const haloMergeNode1 = document.createElementNS(svgNS, "feMergeNode");
    haloMergeNode1.setAttribute("in", "coloredBlur");
    const haloMergeNode2 = document.createElementNS(svgNS, "feMergeNode");
    haloMergeNode2.setAttribute("in", "SourceGraphic");
    haloMerge.appendChild(haloMergeNode1);
    haloMerge.appendChild(haloMergeNode2);

    filterHalo.appendChild(haloBlur);
    filterHalo.appendChild(haloColorMatrix);
    filterHalo.appendChild(haloMerge);

    svg.appendChild(filterPaper);
    svg.appendChild(filterGlow);
    svg.appendChild(filterTextGrain);
    svg.appendChild(filterRipple);
    svg.appendChild(filterHalo);

    document.body.prepend(svg);
}
