let currentFrame = 1;
const frameOptions = ["0.css", "1.css"];
const moods = {
  tldr: "tldr",
};

window.addEventListener("load", () => {
  beginOscillation();
  listenToMood();
  window.initializeChapter && window.initializeChapter();
});

function listenToMood() {
  const stylesheet = document.querySelector("#mood-styles");

  const starterMood = new URLSearchParams(window.location.search).get("mood");
  setDocumentMood(starterMood);

  const moodSelect = document.querySelector("#mood-select");
  if (moodSelect) {
    moodSelect.addEventListener("change", (event) => {
      let value = event.target.value;
      let selection = moods[value];
      setDocumentMood(selection);
    });
  }

  function setDocumentMood(mood = starterMood) {
    document.body.dataset.mood = mood;
    if (!mood) return;
    stylesheet.href = `/css/moods/${mood}.css`;
    adjustLinks(mood);
  }

  function adjustLinks(mood) {
    const links = document.querySelectorAll('a[href*="/book/chapter/"]');
    links.forEach((link) => {
      link.href =
        link.href.split("?")[0].replace(/\/*$/, "") +
        (mood ? `/?mood=${mood}` : "");
    });
  }
}

function beginOscillation() {
  window.oscillationIntervalId = setInterval(() => {
    const stylesheet = document.querySelector("#period-styles");
    stylesheet.href = `/css/frames/${frameOptions[currentFrame]}`;

    currentFrame = (currentFrame + 1) % frameOptions.length;
  }, 1000);
}
