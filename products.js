const filterButtons = document.querySelectorAll(".product-filter-btn");
const productCards = document.querySelectorAll("#productsGrid [data-categories]");
const emptyState = document.getElementById("productsEmptyState");

function setActiveButton(activeButton) {
  filterButtons.forEach((button) => {
    const isActive = button === activeButton;
    button.setAttribute("aria-pressed", String(isActive));

    if (isActive) {
      button.classList.remove("bg-white", "text-slate-700", "border-slate-200");
      button.classList.add("bg-[#1F4D3A]", "text-white", "border-[#1F4D3A]", "shadow-md");
    } else {
      button.classList.remove("bg-[#1F4D3A]", "text-white", "border-[#1F4D3A]", "shadow-md");
      button.classList.add("bg-white", "text-slate-700", "border-slate-200");
    }
  });
}

function applyFilter(filter) {
  let visibleCards = 0;

  productCards.forEach((card) => {
    const categories = (card.dataset.categories || "").split(/\s+/);
    const shouldShow = filter === "all" || categories.includes(filter);
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
    const filter = button.dataset.filter || "all";
    setActiveButton(button);
    applyFilter(filter);
  });
});

const defaultButton = document.querySelector(".product-filter-btn[aria-pressed='true']") || filterButtons[0];
if (defaultButton) {
  setActiveButton(defaultButton);
  applyFilter(defaultButton.dataset.filter || "all");
}
