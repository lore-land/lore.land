document.querySelector("#lore-button").addEventListener("click", () => {
  const loreCollector = document.querySelector("#lore-collector");
  const loreItems = [...loreCollector.children];

  const pageData = {
    nodes: loreItems.map((item) => ({
      id: item.id,
      name: item.innerText,
      identity: item.dataset.content_id,
    })),
    links: [],
  };
  navigator.clipboard.writeText(JSON.stringify(pageData)).then(() => {
    alert("copied to clipboard");
  });
});

const content = {
  "625c563e1a42a67736c20c690cfae19d": {
    f46b0441bc116f6eeee1f6eda659e9f7: "once upon a time in honk.land",
    b0387df74992bf71205602e56957400b: "honk.land forged 9 honks",
  },
  "725b48851e60e06009a30d9e4245c116": {
    b0387df74992bf71205602e56957400b: "honk.land forged 9 honks",
  },
};
const predicates = [["<9 honks> were <being forged>", "<9 honks>"]];

window.initializeChapter = () => {
  const paragraphs = document.querySelectorAll("p");
  paragraphs.forEach((paragraph, i) => {
    const detailIndex = document.body.dataset.mood === "tldr" ? 1 : 0;
    const predicate = predicates[i][detailIndex];
    const predicateHash = window.md5(predicate);

    paragraph.dataset.predicate = predicateHash;

    const paragraphContent = content[predicateHash];

    if (!paragraphContent) {
      console.error("no content for predicate: " + predicateHash);
      return;
    }

    const spans = paragraph.querySelectorAll("span");

    spans.forEach((span, i) => {
      const spanContentId = span.dataset.content_id;
      span.dataset.text = paragraphContent[spanContentId] || "";
    });

    paragraph.addEventListener("click", (event) => {
      const target = event.target;
      const contentId =
        "/book/chapter/1/audio/" + target.dataset.content_id + ".mp3";
      const audio = new Audio(contentId);
      audio
        .play()
        .then((e) => {
          let loreToken = target.dataset.text;
          const loreCollector = document.querySelector("#lore-collector");
          const li = document.createElement("li");
          li.innerText = loreToken;
          li.dataset.content_id = target.dataset.content_id;
          loreCollector.appendChild(li);

          target.classList.add("played");
          if (window.oscillationIntervalId) {
            clearInterval(window.oscillationIntervalId);
            window.oscillationIntervalId = null;
          }
        })
        .catch((error) => {
          console.error(error);
        });
    });
  });
};
