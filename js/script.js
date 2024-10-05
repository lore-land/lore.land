// Constants and Variables
let theta = 0;
const THETA_INCREMENT = 0.02; // Adjust the increment for breathing speed

// Initialize on window load
window.addEventListener("load", () => {
  animateTheta();
  listenToMood();
  listenForInteraction();
});

// Function to animate the --breath-scale CSS variable
function animateTheta() {
  const updateTheta = () => {
    theta += THETA_INCREMENT;
    if (theta > Math.PI * 2) {
      theta -= Math.PI * 2;
    }
    const scaleValue = 1 + 0.005 * Math.sin(theta);
    // Update the --breath-scale variable on the :root element
    document.documentElement.style.setProperty('--breath-scale', scaleValue.toString());
    requestAnimationFrame(updateTheta);
  };
  requestAnimationFrame(updateTheta);
}

// Function to handle mood selection and application
function listenToMood() {
  const MOOD_STYLESHEET_ID = "mood-styles";
  const MOOD_SELECT_ID = "mood-select";
  const moodStylesheet = document.getElementById(MOOD_STYLESHEET_ID);

  // Get the mood from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const starterMood = urlParams.get("mood") || "";

  setDocumentMood(starterMood);

  const moodSelect = document.getElementById(MOOD_SELECT_ID);
  if (moodSelect) {
    moodSelect.value = starterMood;
    moodSelect.addEventListener("change", (event) => {
      const value = event.target.value;
      setDocumentMood(value);
    });
  }

  function setDocumentMood(mood) {
    document.body.dataset.mood = mood || "";
    if (!mood) {
      moodStylesheet.href = "";
    } else {
      moodStylesheet.href = `/css/moods/${mood}.css`;
    }
    adjustLinks(mood);
  }

  function adjustLinks(mood) {
    const CHAPTER_LINK_SELECTOR = 'a[href*="/book/chapter/"]';
    const links = document.querySelectorAll(CHAPTER_LINK_SELECTOR);
    links.forEach((link) => {
      const url = new URL(link.href);
      if (mood) {
        url.searchParams.set("mood", mood);
      } else {
        url.searchParams.delete("mood");
      }
      link.href = url.toString();
    });
  }
}

// Function to handle user interactions and trigger micro animations
function listenForInteraction() {
  const body = document.body;
  const ACTIVE_CLASS = "active";

  // Add event listener to trigger active state and micro animation
  body.addEventListener("click", (e) => {
    if (!body.classList.contains(ACTIVE_CLASS)) {
      body.classList.add(ACTIVE_CLASS);

      // Trigger micro animation by adding a class
      body.classList.add("animate-background");
      // Remove the animation class after animation duration
      setTimeout(() => {
        body.classList.remove("animate-background");
      }, 500); // Adjust duration to match CSS animation duration
    }
  });

  const bookHeader = document.querySelector("#book > header");
  if (bookHeader) {
    bookHeader.addEventListener("click", (e) => {
      e.stopPropagation();
      if (body.classList.contains(ACTIVE_CLASS)) {
        body.classList.remove(ACTIVE_CLASS);

        // Trigger reverse micro animation
        body.classList.add("animate-background-reverse");
        setTimeout(() => {
          body.classList.remove("animate-background-reverse");
        }, 500);
      }
    });
  }
}
