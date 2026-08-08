const inp = document.getElementById("itemINput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("list");

addBtn.addEventListener("click", () => {
  if (inp.value === "") {
    alert("Mat Kr LALA");
    return;
  } else {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = inp.value;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.background = "red";

    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);

    inp.value = "";

    delBtn.addEventListener("click", () => {
      if (delBtn.textContent === "Delete") {
        li.remove();
      } else {
        span.textContent = editInp.value;
        li.replaceChild(span, editInp);
        delBtn.textContent = "Delete";
      }
    });

    let editInp;

    li.addEventListener("dblclick", () => {
      if (delBtn.textContent === "Save") return;

      editInp = document.createElement("input");
      editInp.value = span.textContent;

      li.replaceChild(editInp, span);
      delBtn.textContent = "Save";

      editInp.focus();
    });
  }
});
