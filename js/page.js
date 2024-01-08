document.querySelector("#lore-button").addEventListener("click", () => {
  const pageData = {
    nodes: [],
    links: [],
  };
  navigator.clipboard.writeText(JSON.stringify(pageData)).then(() => {
    alert("copied to clipboard");
  });
});
