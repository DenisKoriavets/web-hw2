const STORAGE_KEY = 'shoppingListItems';
const NEXT_ID_KEY = 'shoppingListNextId';

const DEFAULT_ITEMS = [
    { id: 1, name: 'Помідори', quantity: 2, bought: true },
    { id: 2, name: 'Печиво', quantity: 3, bought: false },
    { id: 3, name: 'Сир', quantity: 1, bought: false }
];

let items = [];
let nextId = 1;
let editingItemId = null;

function loadFromStorage() {
    try {
        const savedItems = localStorage.getItem(STORAGE_KEY);
        const savedNextId = localStorage.getItem(NEXT_ID_KEY);

        if (savedItems && JSON.parse(savedItems).length > 0) {
            items = JSON.parse(savedItems);
        } else {
            addDefaultItemsIfEmpty();
            return;
        }

        if (savedNextId) {
            nextId = parseInt(savedNextId, 10);
        } else {
            const maxId = items.reduce((max, item) => item.id > max ? item.id : max, 0);
            nextId = maxId + 1;
            saveToStorage();
        }
    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        addDefaultItemsIfEmpty();
    }
}

function addDefaultItemsIfEmpty() {
    if (items.length === 0) {
        items = DEFAULT_ITEMS.map(item => ({ ...item }));
        nextId = items.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
        saveToStorage();
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        localStorage.setItem(NEXT_ID_KEY, nextId.toString());
    } catch (error) {
        console.error('Помилка збереження даних:', error);
    }
}

function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(NEXT_ID_KEY);
    } catch (error) {
        console.error('Помилка очищення даних:', error);
    }
}

function generateId() {
    return nextId++;
}

function addItem(name) {
    if (name.trim() === '') return;

    const newItem = {
        id: generateId(),
        name: name.trim(),
        quantity: 1,
        bought: false
    };

    items.push(newItem);
    saveToStorage();
    renderItems();
    updateStats();
}

function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    addDefaultItemsIfEmpty();
    saveToStorage();
    renderItems();
    updateStats();
}

function toggleBought(id) {
    const item = items.find(item => item.id === id);
    if (item) {
        item.bought = !item.bought;
        saveToStorage();
        renderItems();
        updateStats();
    }
}

function updateQuantity(id, change) {
    const item = items.find(item => item.id === id);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity >= 1) {
            item.quantity = newQuantity;
            saveToStorage();
            renderItems();
            updateStats();
        }
    }
}

function startEditing(id) {
    if (editingItemId !== null) {
        finishEditing();
    }
    editingItemId = id;
    renderItems();

    setTimeout(() => {
        const input = document.querySelector(`[data-item-id="${id}"] .editable-name`);
        if (input) {
            input.focus();
            input.select();
        }
    }, 10);
}

function finishEditing() {
    if (editingItemId !== null) {
        const input = document.querySelector(`[data-item-id="${editingItemId}"] .editable-name`);
        if (input) {
            const item = items.find(item => item.id === editingItemId);
            if (item && input.value.trim() !== '') {
                item.name = input.value.trim();
                saveToStorage();
            }
        }
        editingItemId = null;
        renderItems();
        updateStats();
    }
}

function clearAllItems() {
    if (confirm('Ви впевнені, що хочете очистити весь список покупок?')) {
        items = [];
        nextId = 1;
        addDefaultItemsIfEmpty(); // знову додати дефолтні
        saveToStorage();
        renderItems();
        updateStats();
    }
}

function renderItems() {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.setAttribute('data-item-id', item.id);

        const nameElement = editingItemId === item.id
            ? `<input class="editable-name" type="text" value="${item.name}" onblur="finishEditing()" onkeydown="if(event.key==='Enter') finishEditing()">`
            : `<div class="name ${item.bought ? 'strikethrough' : ''}" ${!item.bought ? `onclick="startEditing(${item.id})"` : ''}>${item.name}</div>`;

        const quantityControls = item.bought
            ? `<div class="qty-only">${item.quantity}</div>`
            : `<div class="controls">
                 <button class="circle-btn minus" ${item.quantity <= 1 ? 'disabled' : 'data-tooltip="Зменшити кількість"'} onclick="updateQuantity(${item.id}, -1)">−</button>
                 <div class="qty">${item.quantity}</div>
                 <button class="circle-btn plus" onclick="updateQuantity(${item.id}, 1)" data-tooltip="Збільшити кількість">+</button>
               </div>`;

        const actions = item.bought
            ? `<button class="buy-btn inactive" onclick="toggleBought(${item.id})" data-tooltip="Позначити як не куплено">Не куплено</button>`
            : `<button class="buy-btn" onclick="toggleBought(${item.id})" data-tooltip="Позначити як куплено">Куплено</button>
               <button class="delete-btn" onclick="deleteItem(${item.id})" data-tooltip="Видалити товар зі списку">×</button>`;

        itemDiv.innerHTML = `
            <div class="item-row">
                ${nameElement}
                <div class="controls-container">
                    ${quantityControls}
                </div>
                <div class="actions">
                    ${actions}
                </div>
            </div>
        `;

        itemsList.appendChild(itemDiv);
    });
}

function updateStats() {
    const remainingTags = document.getElementById('remainingTags');
    const boughtTags = document.getElementById('boughtTags');

    remainingTags.innerHTML = '';
    boughtTags.innerHTML = '';

    const remainingItems = items.filter(item => !item.bought);
    remainingItems.forEach(item => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${item.name}
            <div class="tag-qty">${item.quantity}</div>
        `;
        remainingTags.appendChild(tag);
    });

    const boughtItems = items.filter(item => item.bought);
    boughtItems.forEach(item => {
        const tag = document.createElement('div');
        tag.className = 'tag bought';
        tag.innerHTML = `
            <span class="strikethrough">${item.name}</span>
            <div class="tag-qty">${item.quantity}</div>
        `;
        boughtTags.appendChild(tag);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addBtn').addEventListener('click', () => {
        const input = document.getElementById('itemInput');
        addItem(input.value);
        input.value = '';
        input.focus();
    });

    document.getElementById('itemInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = document.getElementById('itemInput');
            addItem(input.value);
            input.value = '';
        }
    });

    document.addEventListener('click', (e) => {
        if (editingItemId !== null && !e.target.closest('.editable-name') && !e.target.closest('.name')) {
            finishEditing();
        }
    });

    window.addEventListener('beforeunload', () => {
        if (editingItemId !== null) {
            finishEditing();
        }
        saveToStorage();
    });

    loadFromStorage();
    renderItems();
    updateStats();
});
