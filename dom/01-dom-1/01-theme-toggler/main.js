const btn = document.querySelector("#toggleBtn");

btn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  btn.textContent = document.body.classList.contains("dark")
    ? "Toggle Light Mode"
    : "Toggle Dark Mode";
});
