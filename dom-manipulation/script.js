// Constants
const STORAGE_QUOTES = "dynamicQuotes";
const STORAGE_CATEGORY = "selectedCategory";
const SESSION_QUOTE = "lastQuoteIndex";

// Initial Data
let quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Imagination is more important than knowledge.", category: "Inspiration" }
];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

// Initialize
function init() {
  loadQuotesFromStorage();
  populateCategories();
  restoreLastSelectedCategory();
  restoreLastShownQuote();
}

// Load quotes from localStorage
function loadQuotesFromStorage() {
  const saved = localStorage.getItem(STORAGE_QUOTES);
  if (saved) {
    try {
      quotes = JSON.parse(saved);
    } catch (e) {
      console.warn("Invalid JSON in local storage.");
    }
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem(STORAGE_QUOTES, JSON.stringify(quotes));
}

// Populate category dropdown
function populateCategories() {
  const uniqueCats = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  uniqueCats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

// Restore last selected category from localStorage
function restoreLastSelectedCategory() {
  const lastCat = localStorage.getItem(STORAGE_CATEGORY);
  if (lastCat) {
    categoryFilter.value = lastCat;
    filterQuotes();
  }
}

// Show the last displayed quote if remembered
function restoreLastShownQuote() {
  const idx = sessionStorage.getItem(SESSION_QUOTE);
  if (idx !== null && quotes[idx]) {
    const q = quotes[idx];
    quoteDisplay.textContent = `"${q.text}" — [${q.category}]`;
  }
}

// Show a random quote based on current filter
function showRandomQuote() {
  const cat = categoryFilter.value;
  const pool = cat === "all" ? quotes : quotes.filter(q => q.category === cat);

  if (pool.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const selected = pool[Math.floor(Math.random() * pool.length)];
  quoteDisplay.textContent = `"${selected.text}" — [${selected.category}]`;
  sessionStorage.setItem(SESSION_QUOTE, quotes.indexOf(selected));
}

// Filter quotes based on category selection
function filterQuotes() {
  const selectedCat = categoryFilter.value;
  localStorage.setItem(STORAGE_CATEGORY, selectedCat);
  quoteDisplay.textContent = "Click 'Show New Quote' to see a quote in this category.";
}

// Add a new quote and update everything
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Both quote and category are required.");

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added!");

  // Optional: Automatically select the new category
  categoryFilter.value = category;
  filterQuotes();
}

// Export quotes as JSON
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes_export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) throw new Error("File must contain an array of quotes.");
      quotes.push(...imported);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // reset input
}

// Event Listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
exportBtn.addEventListener("click", exportQuotes);
importFile.addEventListener("change", importFromFile);
categoryFilter.addEventListener("change", filterQuotes);

const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Replace with real mock if needed

async function syncWithServer() {
  displaySyncMessage("Syncing with server...");

  try {
    // Simulated fetch (in reality, this would be your real endpoint)
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error("Failed to fetch data from server.");

    // Simulate server quote structure (remap posts to quote structure)
    const serverData = await response.json();
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    // Conflict resolution: server wins on text match conflict
    let merged = [];
    let newQuotes = 0;

    serverQuotes.forEach(serverQuote => {
      const match = quotes.find(q => q.text === serverQuote.text);
      if (!match) {
        quotes.push(serverQuote);
        newQuotes++;
      } else {
        // Optional: check and overwrite category if different
        if (match.category !== serverQuote.category) {
          match.category = serverQuote.category;
        }
      }
    });

    if (newQuotes > 0) {
      displaySyncMessage(`Synced: ${newQuotes} new quotes added from server.`);
    } else {
      displaySyncMessage("Sync complete: No new quotes.");
    }

    saveQuotes();
    populateCategories();

  } catch (error) {
    displaySyncMessage("Error syncing with server: " + error.message, true);
  }
}
function displaySyncMessage(msg, isError = false) {
  const statusDiv = document.getElementById("syncStatus");
  statusDiv.textContent = msg;
  statusDiv.style.color = isError ? "red" : "green";

  // Auto clear after 5 seconds
  setTimeout(() => (statusDiv.textContent = ""), 5000);
}
document.getElementById("syncBtn").addEventListener("click", syncWithServer);
setInterval(syncWithServer, 60000); // every 1 minute


// Start
init();
