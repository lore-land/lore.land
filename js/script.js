let currentFrame = 1;
const frameOptions = ["0.css", "1.css"];
const moods = {
  tldr: "tldr",
};

beginOscillation();
listenToMood();

function listenToMood() {
  const moodSelect = document.querySelector("#mood-select");
  const stylesheet = document.querySelector("#mood-styles");

  const starterMood = new URLSearchParams(window.location.search).get("mood");
  setDocumentMood(starterMood);

  moodSelect.addEventListener("change", (event) => {
    let value = event.target.value;
    let selection = moods[value];
    setDocumentMood(selection);
  });

  function setDocumentMood(mood = starterMood) {
    document.body.dataset.mood = mood;
    stylesheet.href = `/css/moods/${mood}.css`;
    adjustLinks(mood);
  }

  function adjustLinks(mood) {
    const links = document.querySelectorAll('a[href*="/book/chapter/"]');
    links.forEach((link) => {
      link.href =
        link.href.split("?")[0].replace(/\/*$/, "") + `/?mood=${mood}`;
    });
  }
}

function beginOscillation() {
  setInterval(() => {
    const stylesheet = document.querySelector("#period-styles");
    stylesheet.href = `/css/frames/${frameOptions[currentFrame]}`;

    currentFrame = (currentFrame + 1) % frameOptions.length;
  }, 1000);
}
