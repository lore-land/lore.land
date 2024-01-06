const options = ["0.css", "1.css"];

let currentSelection = 1;

setInterval(() => {
  document.querySelector(
    "#period-styles"
  ).href = `/css/${options[currentSelection]}`;

  currentSelection = (currentSelection + 1) % options.length;
}, 1000);
