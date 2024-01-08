let currentFrame = 1;
const frameOptions = ["0.css", "1.css"];
const moods = ["tldr"];

beginOscillation();
listenToMood();

function listenToMood() {
  const moodSelect = document.querySelector("#mood-select");
  const stylesheet = document.querySelector("#mood-styles");
  moodSelect.addEventListener("change", (event) => {
    let value = event.target.value;
    stylesheet.href = `/css/moods/${value}.css`;
  });
}

function beginOscillation() {
  setInterval(() => {
    const stylesheet = document.querySelector("#period-styles");
    stylesheet.href = `/css/frames/${frameOptions[currentFrame]}`;

    currentFrame = (currentFrame + 1) % frameOptions.length;
  }, 1000);
}
