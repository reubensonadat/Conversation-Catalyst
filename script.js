// script.js
// DOM Elements
const questionGrid = document.getElementById('questionGrid');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const randomBtn = document.getElementById('randomBtn');
const currentCount = document.getElementById('currentCount');
const totalCount = document.getElementById('totalCount');
const pagination = document.getElementById('pagination');

// Constants
const QUESTIONS_PER_PAGE = 12;
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';
let allQuestions = []; // To store questions loaded from JSON

// Initialize the page
async function init() {
    await loadQuestions(); // Load questions from JSON
    displayCategoryButtons();
    displayQuestions();
    displayPagination();
    updateQuestionCount();
    
    // Event listeners
    searchInput.addEventListener('input', handleSearch);
    randomBtn.addEventListener('click', showRandomQuestion);
}

// Load questions from JSON file
async function loadQuestions() {
    try {
        const response = await fetch('questions.json'); // Ensure this matches your JSON file name
        const data = await response.json();
        allQuestions = data.questions;
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

// Display category filter buttons
function displayCategoryButtons() {
    // Clear existing buttons
    categoryFilter.innerHTML = '';
    
    // Add "All" button
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.dataset.category = 'all';
    allButton.textContent = 'All Questions';
    allButton.addEventListener('click', () => filterByCategory('all'));
    categoryFilter.appendChild(allButton);
    
    // Get unique categories from loaded questions
    const categories = [...new Set(allQuestions.map(q => q.category))].sort();

    // Dynamically add buttons for each category
    categories.forEach(catName => {
        // You might want to map category names to more user-friendly labels here
        // For now, we'll just capitalize the first letter
        const label = catName.charAt(0).toUpperCase() + catName.slice(1).replace('-', ' ');
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.dataset.category = catName;
        button.textContent = label;
        button.addEventListener('click', () => filterByCategory(catName));
        categoryFilter.appendChild(button);
    });
}

// Filter questions by category
function filterByCategory(category) {
    currentCategory = category;
    currentPage = 1;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    displayQuestions();
    displayPagination();
    updateQuestionCount();
}

// Handle search input
function handleSearch() {
    currentSearch = searchInput.value.toLowerCase();
    currentPage = 1;
    displayQuestions();
    displayPagination();
    updateQuestionCount();
}

// Display questions based on filters
function displayQuestions() {
    questionGrid.innerHTML = '';
    
    const filteredQuestions = getFilteredQuestions();
    const paginatedQuestions = paginateQuestions(filteredQuestions);
    
    if (paginatedQuestions.length === 0) {
        questionGrid.innerHTML = `<div class="no-results">No questions found. Try a different search or category.</div>`;
        return;
    }
    
    paginatedQuestions.forEach(question => {
        const questionCard = createQuestionCard(question);
        questionGrid.appendChild(questionCard);
    });
}

// Create question card element
function createQuestionCard(question) {
    const card = document.createElement('div');
    card.className = 'question-card';
    
    // Get category label (you can have a more robust mapping if needed)
    const categoryLabel = question.category.charAt(0).toUpperCase() + question.category.slice(1).replace('-', ' ');
    
    card.innerHTML = `
        <div class="category-tag">${categoryLabel}</div>
        <div class="question-text">${question.text}</div>
        <div class="actions">
            <button><i class="fas fa-copy"></i> Copy</button>
            <button><i class="fas fa-share-alt"></i> Share</button>
            <button><i class="fas fa-heart"></i> Save</button>
        </div>
    `;
    
    // Add copy functionality
    const copyBtn = card.querySelector('button');
    copyBtn.addEventListener('click', () => {
        // Fallback for document.execCommand('copy') for better compatibility
        const textArea = document.createElement("textarea");
        textArea.value = question.text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Failed to copy text', err);
        }
        document.body.removeChild(textArea);

        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
    });
    
    return card;
}

// Get filtered questions based on current filters
function getFilteredQuestions() {
    return allQuestions.filter(question => {
        const matchesCategory = currentCategory === 'all' || question.category === currentCategory;
        const matchesSearch = currentSearch === '' || 
                            question.text.toLowerCase().includes(currentSearch);
        return matchesCategory && matchesSearch;
    });
}

// Paginate questions
function paginateQuestions(questions) {
    const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
    const endIndex = startIndex + QUESTIONS_PER_PAGE;
    return questions.slice(startIndex, endIndex);
}

// Display pagination controls
function displayPagination() {
    pagination.innerHTML = '';
    
    const filteredQuestions = getFilteredQuestions();
    const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
    
    if (totalPages <= 1) return;
    
    // Helper to create a page button
    const createPageButton = (pageNumber, textContent = pageNumber) => {
        const button = document.createElement('button');
        button.textContent = textContent;
        button.classList.toggle('active', pageNumber === currentPage);
        button.addEventListener('click', () => {
            currentPage = pageNumber;
            displayQuestions();
            displayPagination();
            updateQuestionCount(); // Update count after pagination change
        });
        return button;
    };

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayQuestions();
            displayPagination();
            updateQuestionCount(); // Update count after pagination change
        }
    });
    pagination.appendChild(prevButton);
    
    // Page buttons logic
    // Always show first page
    pagination.appendChild(createPageButton(1));

    // Show ellipsis if current page is far from the beginning
    if (currentPage > 3) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.classList.add('pagination-ellipsis'); // Add a class for styling if needed
        pagination.appendChild(ellipsis);
    }

    // Show pages around the current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (i !== 1 && i !== totalPages) { // Avoid duplicating 1 and totalPages if already shown
            pagination.appendChild(createPageButton(i));
        }
    }

    // Show ellipsis if current page is far from the end
    if (currentPage < totalPages - 2) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.classList.add('pagination-ellipsis'); // Add a class for styling if needed
        pagination.appendChild(ellipsis);
    }

    // Always show last page (if more than one page)
    if (totalPages > 1 && (currentPage <= totalPages - 2 || totalPages <= 3)) { // Ensure last page is shown correctly
        if (totalPages !== 1) { // Avoid duplicating if totalPages is 1 (already handled by first page)
             // Only append if it's not the same as the first page (for cases where totalPages is small, e.g., 2)
            if (totalPages > 1 && (totalPages !== 1 || currentPage === 1)) { // Ensure totalPages is distinct from 1, or if it is 1, only show one button
                // This condition avoids showing 1 ... 1 when totalPages is 1.
                // It also ensures the last page button is always distinct unless totalPages is 1.
                if (totalPages !== 1 && (currentPage < totalPages - 1 || totalPages <= 3 || currentPage === totalPages)) {
                   if (totalPages !== 1 && (currentPage <= totalPages - 2 || totalPages <= 3 || currentPage === totalPages)) { // Avoid duplicating if totalPages is 1, and ensure it's shown if close to end or total pages is small
                        // Ensure we don't add the last button if it's already covered by the direct neighborhood of currentPage
                        let shouldAddLastPage = true;
                        if (currentPage === totalPages || currentPage === totalPages -1) {
                             shouldAddLastPage = false; // Already handled by showing current page or current page - 1
                        }

                        if (shouldAddLastPage) {
                             if (totalPages > 1 && totalPages !== 1) {
                                // Add logic to prevent duplicating if it was already added by the immediate neighborhood.
                                // The loop above iterates from Math.max(2, currentPage - 1) up to Math.min(totalPages - 1, currentPage + 1).
                                // If totalPages is already covered by this range (e.g., totalPages = currentPage + 1), don't re-add.
                                const isTotalPageCoveredByMiddle = (totalPages >= Math.max(2, currentPage - 1) && totalPages <= Math.min(totalPages - 1, currentPage + 1));
                                if (!isTotalPageCoveredByMiddle || totalPages === 1) { // Only add if it's not in the middle range, or if total pages is just 1 (which means current page is also 1)
                                    if (totalPages !== 1 || (totalPages === 1 && currentPage !== 1)) { // This prevents the single '1' button from being added twice if totalPages is 1
                                        if (!(totalPages === 1 && currentPage === 1)) { // More explicit check for the single page scenario
                                             if (totalPages !== 1) { // Final check for single page logic
                                                pagination.appendChild(createPageButton(totalPages));
                                            }
                                        }
                                    }
                                }
                             }
                        }
                    }
                }
            }
        }
    }
    
    // Corrected logic for showing page numbers: always show 1, current, and total. Add ellipses for gaps.
    // This part replaces the previous complex loop.
    pagination.innerHTML = ''; // Clear previous buttons before rebuilding
    
    // Previous button
    pagination.appendChild(prevButton);

    const maxVisiblePages = 5; // Total pages to show including 1, ..., and totalPages

    const startPage = Math.max(2, currentPage - Math.floor((maxVisiblePages - 3) / 2));
    const endPage = Math.min(totalPages - 1, currentPage + Math.ceil((maxVisiblePages - 3) / 2));

    let pages = [];

    // Always add first page
    if (totalPages >= 1) { // Ensures page 1 is always added unless there are no pages
        pages.push(1);
    }
    
    // Add ellipsis if needed after page 1
    if (startPage > 2) {
        pages.push('...');
    }

    // Add pages around the current page
    for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) { // Only add if it's not the first or last page
            pages.push(i);
        }
    }

    // Add ellipsis if needed before the last page
    if (endPage < totalPages - 1) {
        if (totalPages > 1 && pages[pages.length - 1] !== '...') { // Prevent duplicate ellipses
             pages.push('...');
        }
    }
    
    // Always add last page (if totalPages > 1 and it's not already covered)
    if (totalPages > 1 && pages.indexOf(totalPages) === -1) {
        pages.push(totalPages);
    }

    // Adjust for small totalPages to avoid ellipsis
    if (totalPages <= maxVisiblePages) {
        pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    }
    
    // Render the generated page buttons
    pages.forEach(page => {
        if (page === '...') {
            const ellipsisSpan = document.createElement('span');
            ellipsisSpan.textContent = '...';
            ellipsisSpan.classList.add('pagination-ellipsis');
            pagination.appendChild(ellipsisSpan);
        } else {
            pagination.appendChild(createPageButton(page));
        }
    });

    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayQuestions();
            displayPagination();
            updateQuestionCount(); // Update count after pagination change
        }
    });
    pagination.appendChild(nextButton);
}

// Update question count display
function updateQuestionCount() {
    const filteredQuestions = getFilteredQuestions();
    // Ensure currentCount does not exceed total filtered questions
    currentCount.textContent = Math.min(
        (currentPage * QUESTIONS_PER_PAGE), // Max count for current page
        filteredQuestions.length // Total filtered questions
    );
    // If there are no questions on the current page, and it's not the first page,
    // adjust currentCount to reflect the actual number on the last page.
    if (currentPage > 1 && paginateQuestions(filteredQuestions).length === 0 && filteredQuestions.length > 0) {
        currentCount.textContent = filteredQuestions.length % QUESTIONS_PER_PAGE;
        if (currentCount.textContent === '0' && filteredQuestions.length !== 0) { // If it's a full last page
            currentCount.textContent = QUESTIONS_PER_PAGE;
        } else if (currentCount.textContent === '0' && filteredQuestions.length === 0) {
            currentCount.textContent = '0';
        }
    } else if (filteredQuestions.length === 0) {
        currentCount.textContent = '0';
    } else {
        // Calculate the actual number of questions displayed on the current page
        const questionsOnCurrentPage = paginateQuestions(filteredQuestions).length;
        // The display should be "Showing X to Y of Z questions" or "Showing X of Z questions"
        // Let's stick to "Showing X of Z questions" where X is the count on current page.
        // It should be 'current count' showing the *actual* number of questions on the current page
        currentCount.textContent = questionsOnCurrentPage;
    }
    totalCount.textContent = filteredQuestions.length;
}

// Show random question
function showRandomQuestion() {
    const filteredQuestions = getFilteredQuestions();
    if (filteredQuestions.length === 0) {
        // Use a custom modal for messages instead of alert()
        const noQuestionsModal = document.createElement('div');
        noQuestionsModal.className = 'modal';
        noQuestionsModal.innerHTML = `
            <div class="modal-content">
                <h3>No Questions Available</h3>
                <div class="random-question">There are no questions that match your current filter or search criteria.</div>
                <div class="modal-actions">
                    <button id="closeNoQuestionsModal">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(noQuestionsModal);
        document.getElementById('closeNoQuestionsModal').addEventListener('click', () => {
            noQuestionsModal.remove();
        });
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    const randomQuestion = filteredQuestions[randomIndex];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Random Question</h3>
            <div class="random-question">${randomQuestion.text}</div>
            <div class="modal-actions">
                <button id="closeModal">Close</button>
                <button id="anotherQuestion">Another Question</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('closeModal').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('anotherQuestion').addEventListener('click', () => {
        modal.remove();
        showRandomQuestion();
    });
}

// Initialize the application
init();
