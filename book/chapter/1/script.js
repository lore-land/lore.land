document.querySelector("#lore-button").addEventListener("click", () => {
  const pageData = {
    nodes: [
      {
        id: "honk[0]",
        name: "honk",
        identity: "honk.one",
      },
    ],
    links: [],
  };
  navigator.clipboard.writeText(JSON.stringify(pageData)).then(() => {
    alert("copied to clipboard");
  });
});
