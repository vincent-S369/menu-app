const STORAGE_KEYS = {
  recipes: 'recipes',
  weeklyMenus: 'weeklyMenus',
  checkedItems: 'checkedItems'
};

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const meals = ['早餐', '午餐', '晚餐'];

const dayOrder = {
  '周一': 1,
  '周二': 2,
  '周三': 3,
  '周四': 4,
  '周五': 5,
  '周六': 6,
  '周日': 7
};

const mealOrder = {
  '早餐': 1,
  '午餐': 2,
  '晚餐': 3
};

let recipes = [];
let weeklyMenus = [];
let checkedItems = [];
let editingRecipeIndex = null;
let editingMenuIndex = null;

document.addEventListener('DOMContentLoaded', function() {
  loadData();
  bindNavigation();
  bindContentActions();
});

function bindNavigation() {
  document.querySelectorAll('[data-section]').forEach(function(button) {
    button.addEventListener('click', function() {
      showSection(button.dataset.section);
    });
  });
}

function bindContentActions() {
  const contentArea = getContentArea();

  contentArea.addEventListener('click', function(event) {
    const actionElement = event.target.closest('[data-action]');

    if (!actionElement || !contentArea.contains(actionElement)) {
      return;
    }

    const action = actionElement.dataset.action;
    const index = Number(actionElement.dataset.index);

    if (action === 'save-recipe') {
      saveRecipe();
    } else if (action === 'edit-recipe') {
      editRecipe(index);
    } else if (action === 'delete-recipe') {
      deleteRecipe(index);
    } else if (action === 'save-weekly-menu') {
      saveWeeklyMenu();
    } else if (action === 'edit-weekly-menu') {
      editWeeklyMenu(index);
    } else if (action === 'delete-weekly-menu') {
      deleteWeeklyMenu(index);
    } else if (action === 'export-data') {
      exportData();
    } else if (action === 'choose-import-file') {
      chooseImportFile();
    }
  });

  contentArea.addEventListener('change', function(event) {
    if (event.target.dataset.action === 'toggle-checked-item') {
      toggleCheckedItem(event.target.dataset.name);
    } else if (event.target.dataset.action === 'import-data') {
      importData(event.target.files[0]);
    }
  });
}

function getContentArea() {
  return document.getElementById('content-area');
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.recipes, JSON.stringify(recipes));
  localStorage.setItem(STORAGE_KEYS.weeklyMenus, JSON.stringify(weeklyMenus));
  localStorage.setItem(STORAGE_KEYS.checkedItems, JSON.stringify(checkedItems));
}

function loadData() {
  recipes = loadArray(STORAGE_KEYS.recipes);
  weeklyMenus = loadArray(STORAGE_KEYS.weeklyMenus);
  checkedItems = loadArray(STORAGE_KEYS.checkedItems);
}

function loadArray(key) {
  const savedValue = localStorage.getItem(key);

  if (!savedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(savedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

function showSection(section) {
  if (section === 'recipes') {
    renderRecipes();
  } else if (section === 'weekly') {
    renderWeeklyMenu();
  } else if (section === 'shopping') {
    renderShoppingList();
  } else if (section === 'add') {
    renderRecipeForm();
  } else if (section === 'backup') {
    renderBackup();
  }
}

function renderRecipes() {
  const contentArea = getContentArea();

  if (recipes.length === 0) {
    contentArea.innerHTML = `
      <h3>菜谱库</h3>
      <p>目前还没有菜谱，请先去“新增菜谱”添加。</p>
    `;
    return;
  }

  let recipesHtml = '<h3>菜谱库</h3>';

  recipes.forEach(function(recipe, index) {
    recipesHtml += `
      <div class="recipe-card">
        <h4>${escapeHtml(recipe.name)}</h4>
        <p><strong>食材：</strong>${escapeHtml(recipe.ingredients)}</p>
        <p><strong>做法：</strong>${escapeHtml(recipe.method)}</p>
        <button class="edit-btn" type="button" data-action="edit-recipe" data-index="${index}">编辑菜谱</button>
        <button class="delete-btn" type="button" data-action="delete-recipe" data-index="${index}">删除菜谱</button>
      </div>
    `;
  });

  contentArea.innerHTML = recipesHtml;
}

function renderWeeklyMenu() {
  const contentArea = getContentArea();
  const editingMenu = getEditingMenu();

  if (recipes.length === 0) {
    contentArea.innerHTML = `
      <h3>每周菜单</h3>
      <p>请先去“新增菜谱”添加至少一道菜谱。</p>
    `;
    return;
  }

  contentArea.innerHTML = `
    <h3>每周菜单</h3>

    <div class="form-group">
      <label>星期</label>
      <select id="menu-day">
        ${buildOptions(days, editingMenu ? editingMenu.day : null)}
      </select>
    </div>

    <div class="form-group">
      <label>餐次</label>
      <select id="menu-meal">
        ${buildOptions(meals, editingMenu ? editingMenu.meal : null)}
      </select>
    </div>

    <div class="form-group">
      <label>选择菜谱</label>
      <select id="menu-recipe">
        ${buildOptions(recipes.map(function(recipe) {
          return recipe.name;
        }), editingMenu ? editingMenu.recipeName : null)}
      </select>
    </div>

    <button class="save-btn" type="button" data-action="save-weekly-menu">${editingMenu ? '保存修改' : '保存菜单'}</button>

    <div id="weekly-menu-list" class="weekly-menu-list">
      ${renderWeeklyMenuList()}
    </div>
  `;
}

function renderWeeklyMenuList() {
  if (weeklyMenus.length === 0) {
    return '<p>当前还没有安排菜单。</p>';
  }

  return weeklyMenus
    .map(function(menu, index) {
      return {
        day: menu.day,
        meal: menu.meal,
        recipeName: menu.recipeName,
        index: index
      };
    })
    .sort(function(a, b) {
      if (dayOrder[a.day] !== dayOrder[b.day]) {
        return dayOrder[a.day] - dayOrder[b.day];
      }

      return mealOrder[a.meal] - mealOrder[b.meal];
    })
    .map(function(menu) {
      return `
        <div class="recipe-card">
          <h4>${escapeHtml(menu.day)}｜${escapeHtml(menu.meal)}</h4>
          <p><strong>菜谱：</strong>${escapeHtml(menu.recipeName)}</p>
          <button class="edit-btn" type="button" data-action="edit-weekly-menu" data-index="${menu.index}">编辑菜单</button>
          <button class="delete-btn" type="button" data-action="delete-weekly-menu" data-index="${menu.index}">删除菜单</button>
        </div>
      `;
    })
    .join('');
}

function renderShoppingList() {
  const contentArea = getContentArea();

  if (weeklyMenus.length === 0) {
    contentArea.innerHTML = `
      <h3>采购清单</h3>
      <p>请先去“每周菜单”安排至少一条菜单。</p>
    `;
    return;
  }

  const ingredientCounts = getIngredientCounts();
  const ingredientNames = Object.keys(ingredientCounts);
  let shoppingHtml = '<h3>采购清单</h3>';

  if (ingredientNames.length === 0) {
    shoppingHtml += '<p>当前没有可生成的食材清单。</p>';
  } else {
    shoppingHtml += '<div class="shopping-list">';

    ingredientNames.forEach(function(name) {
      const checked = checkedItems.includes(name);

      shoppingHtml += `
        <div class="shopping-item ${checked ? 'checked' : ''}">
          <label class="shopping-label">
            <input
              type="checkbox"
              data-action="toggle-checked-item"
              data-name="${escapeHtml(name)}"
              ${checked ? 'checked' : ''}
            />
            <span>🛒 ${escapeHtml(name)} × ${ingredientCounts[name]}</span>
          </label>
        </div>
      `;
    });

    shoppingHtml += '</div>';
  }

  contentArea.innerHTML = shoppingHtml;
}

function renderRecipeForm() {
  const contentArea = getContentArea();
  const editingRecipe = getEditingRecipe();

  contentArea.innerHTML = `
    <h3>${editingRecipe ? '编辑菜谱' : '新增菜谱'}</h3>
    <div class="form-group">
      <label>菜名</label>
      <input id="recipe-name" type="text" placeholder="例如：番茄炒蛋" value="${editingRecipe ? escapeHtml(editingRecipe.name) : ''}" />
    </div>

    <div class="form-group">
      <label>食材</label>
      <textarea id="recipe-ingredients" placeholder="例如：番茄、鸡蛋、盐">${editingRecipe ? escapeHtml(editingRecipe.ingredients) : ''}</textarea>
    </div>

    <div class="form-group">
      <label>做法</label>
      <textarea id="recipe-method" placeholder="例如：番茄切块，鸡蛋打散炒熟，再加入番茄翻炒。">${editingRecipe ? escapeHtml(editingRecipe.method) : ''}</textarea>
    </div>

    <button class="save-btn" type="button" data-action="save-recipe">${editingRecipe ? '保存修改' : '保存菜谱'}</button>

    <div id="recipe-preview"></div>
  `;
}

function renderBackup() {
  const contentArea = getContentArea();

  contentArea.innerHTML = `
    <h3>数据备份</h3>
    <p>用于备份或迁移本地菜谱、每周菜单和采购清单状态。</p>

    <div class="recipe-card">
      <h4>当前数据</h4>
      <p><strong>菜谱：</strong>${recipes.length} 条</p>
      <p><strong>每周菜单：</strong>${weeklyMenus.length} 条</p>
      <p><strong>已勾选食材：</strong>${checkedItems.length} 项</p>
    </div>

    <div class="backup-actions">
      <button class="save-btn" type="button" data-action="export-data">导出数据</button>
      <button class="edit-btn" type="button" data-action="choose-import-file">导入数据文件</button>
      <input
        id="backup-import-file"
        class="backup-file-input"
        type="file"
        accept=".json,application/json"
        data-action="import-data"
      />
    </div>
  `;
}

function saveRecipe() {
  const nameInput = document.getElementById('recipe-name');
  const ingredientsInput = document.getElementById('recipe-ingredients');
  const methodInput = document.getElementById('recipe-method');
  const preview = document.getElementById('recipe-preview');

  const name = nameInput.value.trim();
  const ingredients = ingredientsInput.value.trim();
  const method = methodInput.value.trim();

  if (!name || !ingredients || !method) {
    alert('请把菜名、食材和做法都填写完整。');
    return;
  }

  const recipe = {
    name: name,
    ingredients: ingredients,
    method: method
  };

  if (editingRecipeIndex !== null && recipes[editingRecipeIndex]) {
    const oldRecipeName = recipes[editingRecipeIndex].name;

    recipes[editingRecipeIndex] = recipe;
    weeklyMenus = weeklyMenus.map(function(menu) {
      if (menu.recipeName === oldRecipeName) {
        return {
          ...menu,
          recipeName: name
        };
      }

      return menu;
    });

    editingRecipeIndex = null;
    saveData();
    showSection('recipes');
    return;
  }

  editingRecipeIndex = null;
  recipes.push(recipe);
  saveData();

  preview.innerHTML = `
    <div class="recipe-card">
      <h4>${escapeHtml(name)}</h4>
      <p><strong>食材：</strong>${escapeHtml(ingredients)}</p>
      <p><strong>做法：</strong>${escapeHtml(method)}</p>
      <p><strong>状态：</strong>已加入菜谱库</p>
    </div>
  `;

  nameInput.value = '';
  ingredientsInput.value = '';
  methodInput.value = '';
}

function saveWeeklyMenu() {
  const day = document.getElementById('menu-day').value;
  const meal = document.getElementById('menu-meal').value;
  const recipeName = document.getElementById('menu-recipe').value;

  const existedMenu = weeklyMenus.find(function(menu, index) {
    if (editingMenuIndex !== null && index === editingMenuIndex) {
      return false;
    }

    return menu.day === day && menu.meal === meal;
  });

  if (existedMenu) {
    alert('这个时间段已经安排过菜单了，请先删除原有菜单再添加。');
    return;
  }

  const menu = {
    day: day,
    meal: meal,
    recipeName: recipeName
  };

  if (editingMenuIndex !== null && weeklyMenus[editingMenuIndex]) {
    weeklyMenus[editingMenuIndex] = menu;
  } else {
    weeklyMenus.push(menu);
  }

  editingMenuIndex = null;
  saveData();
  showSection('weekly');
}

function deleteRecipe(index) {
  if (!recipes[index]) {
    return;
  }

  const deletedRecipeName = recipes[index].name;

  recipes.splice(index, 1);
  weeklyMenus = weeklyMenus.filter(function(menu) {
    return menu.recipeName !== deletedRecipeName;
  });

  if (editingRecipeIndex === index) {
    editingRecipeIndex = null;
  }

  saveData();
  showSection('recipes');
}

function deleteWeeklyMenu(index) {
  if (!weeklyMenus[index]) {
    return;
  }

  weeklyMenus.splice(index, 1);

  if (editingMenuIndex === index) {
    editingMenuIndex = null;
  }

  saveData();
  showSection('weekly');
}

function toggleCheckedItem(name) {
  if (checkedItems.includes(name)) {
    checkedItems = checkedItems.filter(function(item) {
      return item !== name;
    });
  } else {
    checkedItems.push(name);
  }

  saveData();
  showSection('shopping');
}

function exportData() {
  const backupData = {
    recipes: recipes,
    weeklyMenus: weeklyMenus,
    checkedItems: checkedItems
  };
  const json = JSON.stringify(backupData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `menu-app-backup-${getTodayText()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function chooseImportFile() {
  const fileInput = document.getElementById('backup-import-file');

  if (fileInput) {
    fileInput.value = '';
    fileInput.click();
  }
}

function importData(file) {
  if (!file) {
    return;
  }

  const confirmed = confirm('导入会覆盖当前本地数据，确定继续吗？');

  if (!confirmed) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function(event) {
    try {
      const importedData = JSON.parse(event.target.result);

      if (!isValidBackupData(importedData)) {
        alert('文件格式不正确');
        return;
      }

      recipes = importedData.recipes;
      weeklyMenus = importedData.weeklyMenus;
      checkedItems = importedData.checkedItems;
      editingRecipeIndex = null;
      editingMenuIndex = null;

      saveData();
      showSection('backup');
      alert('导入成功');
    } catch (error) {
      alert('文件格式不正确');
    }
  };

  reader.onerror = function() {
    alert('文件格式不正确');
  };

  reader.readAsText(file);
}

function editRecipe(index) {
  if (!recipes[index]) {
    return;
  }

  editingRecipeIndex = index;
  showSection('add');
}

function editWeeklyMenu(index) {
  if (!weeklyMenus[index]) {
    return;
  }

  editingMenuIndex = index;
  showSection('weekly');
}

function getEditingRecipe() {
  if (editingRecipeIndex === null || !recipes[editingRecipeIndex]) {
    return null;
  }

  return recipes[editingRecipeIndex];
}

function getEditingMenu() {
  if (editingMenuIndex === null || !weeklyMenus[editingMenuIndex]) {
    return null;
  }

  return weeklyMenus[editingMenuIndex];
}

function buildOptions(options, selectedValue) {
  return options.map(function(option) {
    const selected = option === selectedValue ? 'selected' : '';
    return `<option value="${escapeHtml(option)}" ${selected}>${escapeHtml(option)}</option>`;
  }).join('');
}

function getIngredientCounts() {
  const ingredientCounts = {};

  weeklyMenus.forEach(function(menu) {
    const matchedRecipe = recipes.find(function(recipe) {
      return recipe.name === menu.recipeName;
    });

    if (!matchedRecipe) {
      return;
    }

    matchedRecipe.ingredients.split('、').forEach(function(item) {
      const ingredient = item.trim();

      if (!ingredient) {
        return;
      }

      if (ingredientCounts[ingredient]) {
        ingredientCounts[ingredient] += 1;
      } else {
        ingredientCounts[ingredient] = 1;
      }
    });
  });

  return ingredientCounts;
}

function isValidBackupData(data) {
  if (
    !data ||
    !Array.isArray(data.recipes) ||
    !Array.isArray(data.weeklyMenus) ||
    !Array.isArray(data.checkedItems)
  ) {
    return false;
  }

  const recipesAreValid = data.recipes.every(function(recipe) {
    return Boolean(
      recipe &&
      typeof recipe.name === 'string' &&
      typeof recipe.ingredients === 'string' &&
      typeof recipe.method === 'string'
    );
  });

  const weeklyMenusAreValid = data.weeklyMenus.every(function(menu) {
    return Boolean(
      menu &&
      typeof menu.day === 'string' &&
      typeof menu.meal === 'string' &&
      typeof menu.recipeName === 'string'
    );
  });

  const checkedItemsAreValid = data.checkedItems.every(function(item) {
    return typeof item === 'string';
  });

  return recipesAreValid && weeklyMenusAreValid && checkedItemsAreValid;
}

function getTodayText() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
