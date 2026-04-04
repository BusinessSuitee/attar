const galleryFilterButtons = document.querySelectorAll(".gallery-filter-btn");
const galleryItems = document.querySelectorAll("#galleryGrid .gallery-item");
const galleryEmptyState = document.getElementById("galleryEmptyState");
const galleryMoreWrap = document.getElementById("galleryMoreWrap");

function setGalleryActiveButton(activeButton) {
  galleryFilterButtons.forEach((button) => {
    const isActive = button === activeButton;
    button.setAttribute("aria-pressed", String(isActive));

    button.classList.remove(
      "border-primary",
      "text-text-main",
      "dark:text-white",
      "border-transparent",
      "text-text-secondary",
      "dark:text-gray-400",
      "hover:text-text-main",
      "dark:hover:text-white",
      "hover:border-primary/30"
    );

    if (isActive) {
      button.classList.add("border-primary", "text-text-main", "dark:text-white");
    } else {
      button.classList.add(
        "border-transparent",
        "text-text-secondary",
        "dark:text-gray-400",
        "hover:text-text-main",
        "dark:hover:text-white",
        "hover:border-primary/30"
      );
    }
  });
}

function applyGalleryFilter(filter) {
  let visibleCount = 0;

  galleryItems.forEach((item) => {
    const categories = (item.dataset.categories || "").split(/\s+/);
    const shouldShow = filter === "all" || categories.includes(filter);

    item.classList.toggle("hidden", !shouldShow);
    if (shouldShow) visibleCount += 1;
  });

  if (galleryEmptyState) {
    galleryEmptyState.classList.toggle("hidden", visibleCount > 0);
  }

  if (galleryMoreWrap) {
    galleryMoreWrap.classList.toggle("hidden", visibleCount === 0);
  }
}

galleryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter || "all";
    setGalleryActiveButton(button);
    applyGalleryFilter(filter);
  });
});

const defaultGalleryButton = document.querySelector(".gallery-filter-btn[aria-pressed='true']") || galleryFilterButtons[0];
if (defaultGalleryButton) {
  setGalleryActiveButton(defaultGalleryButton);
  applyGalleryFilter(defaultGalleryButton.dataset.filter || "all");
}
