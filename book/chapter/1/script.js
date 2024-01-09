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
