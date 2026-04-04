const filterButtons = document.querySelectorAll(".product-filter-btn");
const productCards = document.querySelectorAll("#productsGrid [data-categories]");
const emptyState = document.getElementById("productsEmptyState");

function setActiveButton(activeButton) {
  filterButtons.forEach((button) => {
    const isActive = button === activeButton;
    button.setAttribute("aria-pressed", String(isActive));

    if (isActive) {
      button.classList.remove("bg-slate-100", "text-slate-600");
      button.classList.add("bg-primary", "text-white", "shadow-md");
    } else {
      button.classList.remove("bg-primary", "text-white", "shadow-md");
      button.classList.add("bg-slate-100", "text-slate-600");
    }
  });
}

function applyFilter(filter) {
  let visibleCards = 0;

  productCards.forEach((card) => {
    const categories = (card.dataset.categories || "").split(/\s+/);
    const shouldShow = categories.includes(filter);
    card.classList.toggle("hidden", !shouldShow);

    if (shouldShow) {
      visibleCards += 1;
    }
  });

  if (!emptyState) return;
  emptyState.classList.toggle("hidden", visibleCards > 0);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter || "";
    if (!filter) return;

    setActiveButton(button);
    applyFilter(filter);
  });
});

const defaultButton = document.querySelector(".product-filter-btn[aria-pressed='true']") || filterButtons[0];
if (defaultButton) {
  setActiveButton(defaultButton);
  applyFilter(defaultButton.dataset.filter || "");
}
