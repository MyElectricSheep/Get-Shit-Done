////////////////////
// APP NAMESPACE //
//////////////////

const APP_NAME = "Trello-Clone";

///////////////////////
// GLOBAL SELECTORS //
/////////////////////

const categoriesContainer = document.querySelector(
  "[data-categories-container]"
);
const [addCategoryInput, addCategoryButton] = document.querySelector(
  "[data-add-category]"
).children;

const [checkbox, checkboxLabel] = document.querySelector(
  "[data-switcher]"
).children;

const [addTaskInput, addTaskButton] = document.querySelector(
  "[data-add-task]"
).children;

const categoryHeaders = document.getElementsByTagName("h2");

const selector = document.querySelector(`[data-add-task-selector]`);

let draggables;
let containers;

///////////////////////////
// CATEGORIES AND TASKS //
/////////////////////////

// Initial Data: used only if the user does not have
// anything saved in localStorage yet

// Initial categories data
let categories = [
  {
    id: 1,
    description: "To Do"
  },
  {
    id: 2,
    description: "Ongoing"
  }
];

// Initial tasks data
let tasks = [
  {
    id: 1,
    description: "Buy bread",
    time: { added: Date.now() },
    completed: false,
    category: 1,
    position: 1
  },
  {
    id: 2,
    description: "Go run",
    time: { added: Date.now() },
    completed: false,
    category: 1,
    position: 2
  },
  {
    id: 3,
    description: "Ride my motorbike",
    time: { added: Date.now() },
    completed: false,
    category: 1,
    position: 3
  },
  {
    id: 4,
    description: "Learn Javascript",
    time: { added: Date.now() },
    completed: false,
    category: 2,
    position: 1
  },
  {
    id: 5,
    description: "Buy chicken pad thai ingredients",
    time: { added: Date.now() },
    completed: false,
    category: 2,
    position: 2
  }
];

////////////////
// TEMPLATES //
//////////////

const getCategoryTemplate = (name, id) =>
  `
<div class="col-md text-center" data-draggable-container data-draggable-container-id=${id} >
<h2 data-category-header>${name}</h2>
</div>
`;

const getTaskTemplate = (id, description, position, completed, time) =>
  `
  <div class="sticky-container draggable" draggable="true" data-draggable-item data-draggable-item-id=${id} data-draggable-item-time=${time} data-draggable-item-position=${position}>
  <div class="sticky-outer">
    <div class="sticky">
    <img src="/src/img/pin.png" class="sticky-pin" alt="red pin" />
      <svg width="0" height="0">
        <defs>
          <clipPath id="stickyClip" clipPathUnits="objectBoundingBox">
            <path
                  d="M 0 0 Q 0 0.69, 0.03 0.96 0.03 0.96, 1 0.96 Q 0.96 0.69, 0.96 0 0.96 0, 0 0"
                  stroke-linejoin="round"
                  stroke-linecap="square"
                  />  
          </clipPath>
        </defs>
      </svg>
      <div class="sticky-content">
      <div class="d-flex justify-content-center align-items-center mt-2 mb-2">
      <h6 class="task-description dont-break-out ${
        completed && "completed"
      }">${description}</h6>
    </div>
      </div>
    </div>
  </div>
  <div class="sticky-buttons">
  <i class="bi bi-pen icon icon-edit" data-action="edit"></i>
  <i class="bi bi-x-circle icon icon-delete" data-action="delete"></i>
  <i class="bi bi-check-circle icon icon-check" data-action="check"></i>
  </div>
</div>
  `;

///////////////////////////////////////////
// CATEGORIES AND TASKS ADDER FUNCTIONS //
/////////////////////////////////////////

function addCategory(newCategoryName, id) {
  categoriesContainer.insertAdjacentHTML(
    "beforeend",
    getCategoryTemplate(newCategoryName, id)
  );
}

function addTask(category, { id, description, position, completed, time }) {
  category.insertAdjacentHTML(
    "beforeend",
    getTaskTemplate(id, description, position, completed, time)
  );
}

const createCategory = () => {
  const newCategoryName = addCategoryInput.value;
  categories.push({
    id: categories.length + 1,
    description: newCategoryName
  });
  saveAndRender();
  addCategoryInput.value = "";
};

// Create the category if the user hits enter
addCategoryInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    createCategory();
  }
});

// Create the category if the user hits the + category button
addCategoryButton.addEventListener("click", () => {
  createCategory();
});

const createTask = () => {
  const categoryId = Number(selector.value);
  if (!categoryId) return alert("You must select a category to add a task");
  const position = tasks.filter((t) => t.category === categoryId).length + 1;
  const newTaskName = addTaskInput.value;
  tasks.push({
    id: tasks.length + 1,
    description: newTaskName,
    time: { added: Date.now() },
    completed: false,
    category: categoryId,
    position: position
  });
  saveAndRender();
  addTaskInput.value = "";
};

// Create the task if the user hits enter
addTaskInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    createTask();
  }
});

// Create the task if the user clicks on the + task button
addTaskButton.addEventListener("click", () => {
  createTask();
});

//////////////////////////////////
// DRAG & DROP FUNCTIONALITIES //
////////////////////////////////

function getDragAfterElement(container, y) {
  // Get all draggable elements except the one currently being dragged
  const draggableElements = [
    ...container.querySelectorAll("[data-draggable-item]:not(.dragging)")
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// Swap between the category / task inputs with a switch button
checkbox.addEventListener("click", (e) => {
  const target = !e.target.checked ? "task" : "category";
  const other = e.target.checked ? "task" : "category";

  checkboxLabel.textContent = `Add ${target}`;

  const currentInput = document.querySelector(`[data-add-${target}]`);
  const otherInput = document.querySelector(`[data-add-${other}]`);

  target === "task" ? (selector.hidden = false) : (selector.hidden = true);

  currentInput.hidden = false;
  otherInput.hidden = true;
});

function render() {
  ///////////////////////////////////////
  // GRAB INFO FROM THE LOCAL STORAGE //
  //////////////////////////////////////
  const localStorageCategories = JSON.parse(
    localStorage.getItem(`${APP_NAME}-categories`)
  );
  if (localStorageCategories) categories = localStorageCategories;
  const localStorageTasks = JSON.parse(
    localStorage.getItem(`${APP_NAME}-tasks`)
  );
  if (localStorageTasks) tasks = localStorageTasks;

  //////////////////////////////
  // REFRESH THE DOM SECTION //
  ////////////////////////////

  // Clear out any categories on the screen
  clearElement(categoriesContainer);

  // Add all categories from the categories array
  categories.forEach((cat) => {
    addCategory(cat.description, cat.id);
  });

  // Each new category added is stored as a draggable container
  containers = document.querySelectorAll("[data-draggable-container]");

  // Add tasks from the tasks array into their categories
  // and sort them based on their position in the category
  containers.forEach((c) => {
    const relatedTasks = tasks.filter(
      (t) => t.category === Number(c.dataset.draggableContainerId)
    );
    // console.log(relatedTasks);
    relatedTasks
      .sort((a, b) => a.position - b.position)
      .forEach((task) => {
        addTask(c, task);
      });
  });

  // Add the event listeners to the delete/check/edit icons
  document.querySelectorAll(".icon").forEach((icon) => {
    icon.addEventListener("click", (e) => {
      const parentContainer = e.currentTarget.closest("[data-draggable-item]");
      const action = e.currentTarget.dataset.action;
      const targetItemId = Number(parentContainer.dataset.draggableItemId);
      const targetTask = tasks.find((t) => t.id === targetItemId);
      const index = tasks.indexOf(targetTask);

      // Delete icon
      if (action === "delete") {
        tasks = tasks.filter((t) => t.id !== targetItemId);
        saveAndRender();
      }

      // Check Icon
      if (action === "check") {
        tasks[index].completed = !tasks[index].completed;
        saveAndRender();
      }

      // Edit icon
      if (action === "edit") {
        // const taskDescription = parentContainer.children[0];
        const taskDescription = parentContainer.querySelector(
          ".task-description"
        );
        taskDescription.contentEditable = true;
        taskDescription.focus();

        const handleFinishTaskEdition = (e) => {
          if (taskDescription.textContent.length >= 257)
            alert("Task description is limited to 256 characters");
          const newContent = taskDescription.textContent.slice(0, 256);
          if (e.type === "blur" || e.key === "Enter") {
            tasks[index].description = newContent;
            saveAndRender();
          }
        };

        taskDescription.addEventListener("blur", handleFinishTaskEdition);
        taskDescription.addEventListener("keydown", handleFinishTaskEdition);
      }
    });
  });

  // Add the event listener to delete the category headers and associated tasks
  [...categoryHeaders].forEach((categoryHeader) => {
    categoryHeader.addEventListener("click", function () {
      const categoryId = Number(
        this.parentElement.dataset.draggableContainerId
      );
      categories = categories.filter((c) => c.id !== categoryId);
      tasks = tasks.filter((t) => t.category !== categoryId);
      saveAndRender();
    });
  });

  // Each new task added is stored as a draggable item
  draggables = document.querySelectorAll("[data-draggable-item]");

  clearElement(selector);
  // The select element is filled with the different categories options
  categories.forEach((cat) => {
    const optionTemplate = `<option value=${cat.id}>${cat.description}</option>`;
    selector.insertAdjacentHTML("beforeend", optionTemplate);
  });

  ////////////////////////////
  // DRAG AND DROP SECTION //
  //////////////////////////

  // Drag & Drop tutorial:
  // https://www.youtube.com/watch?v=jfYWwQrtzzY
  draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", () => {
      draggable.classList.add("dragging");
    });
    draggable.addEventListener("dragend", () => {
      draggable.classList.remove("dragging");
      const parentContainer = draggable.parentElement;
      const taskId = Number(draggable.dataset.draggableItemId);
      const newCategoryId = Number(
        draggable.parentElement.dataset.draggableContainerId
      );

      for (let child of parentContainer.children) {
        const id = child.dataset.draggableItemId;
        if (id) {
          const targetTask = tasks.find((t) => t.id === Number(id));
          const newPosition = indexInParent(child);
          targetTask.position = newPosition;
          // Editing the element's position itself is
          // not necessary as we re-render after the dragend event
          // child.dataset.draggableItemPosition = newPosition;
        }
      }

      const targetTask = tasks.find((t) => t.id === taskId);
      targetTask.category = newCategoryId;
      saveAndRender();
    });
  });

  containers.forEach((container) => {
    container.addEventListener("dragover", (e) => {
      e.preventDefault(); // prevents disabled (/) icon

      // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientY
      const afterElement = getDragAfterElement(container, e.clientY);
      const currentDraggable = document.querySelector(".dragging");

      if (!afterElement) {
        container.appendChild(currentDraggable);
      } else {
        container.insertBefore(currentDraggable, afterElement);
      }
    });
  });
}

////////////////////////
// UTILITY FUNCTIONS //
//////////////////////

// Clear all the children of an element
function clearElement(item) {
  while (item.firstChild) {
    item.removeChild(item.firstChild);
  }
}

// Find the index of a target node inside its parent
// https://stackoverflow.com/questions/13658021/jquery-index-in-vanilla-javascript
function indexInParent(node) {
  let children = node.parentNode.childNodes;
  let num = 0;
  for (let i = 0; i < children.length; i++) {
    if (children[i] == node) return num;
    if (children[i].nodeType == 1) num++;
  }
  return -1;
}

// Save the categories and tasks to local storage
function save() {
  localStorage.setItem(`${APP_NAME}-categories`, JSON.stringify(categories));
  localStorage.setItem(`${APP_NAME}-tasks`, JSON.stringify(tasks));
}

// Save to localStorage + rebuild the DOM
function saveAndRender() {
  save();
  render();
}

// Build the initial DOM
render();
