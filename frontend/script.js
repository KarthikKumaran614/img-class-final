// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const classifyBtn = document.getElementById('classifyBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const loadingOverlay = document.getElementById('loadingOverlay');
const statusIndicator = document.getElementById('statusIndicator');
const galleryGrid = document.getElementById('galleryGrid');

// State
let selectedFile = null;
let selectedModel = 'baseline';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkServerHealth();
    loadSampleGallery();
});

function initializeApp() {
    // Set initial model selection
    const modelRadios = document.querySelectorAll('input[name="model"]');
    modelRadios.forEach(radio => {
        if (radio.checked) {
            selectedModel = radio.value;
        }
    });
}

function setupEventListeners() {
    // Upload area click
    uploadArea.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Model selection
    const modelRadios = document.querySelectorAll('input[name="model"]');
    modelRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedModel = e.target.value;
        });
    });

    // Classify button
    classifyBtn.addEventListener('click', handleClassify);

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClear);
    }
}

// Server Health Check
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();

        if (data.status === 'healthy') {
            updateStatus('connected', `Connected • ${data.model_type}`);
        } else {
            updateStatus('error', 'Server Error');
        }
    } catch (error) {
        updateStatus('error', 'Server Offline');
        console.error('Health check failed:', error);
    }
}

function updateStatus(status, text) {
    statusIndicator.className = `status-indicator ${status}`;
    statusIndicator.querySelector('.status-text').textContent = text;
}

// File Handling
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        displaySelectedImage(file);
        classifyBtn.disabled = false;
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        fileInput.files = e.dataTransfer.files;
        displaySelectedImage(file);
        classifyBtn.disabled = false;
    }
}

function displaySelectedImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadArea.innerHTML = `
            <div class="upload-content">
                <img src="${e.target.result}" style="max-width: 100%; max-height: 300px; border-radius: 12px; margin-bottom: 1rem;">
                <h3>Image Selected</h3>
                <p>${file.name}</p>
                <div class="upload-formats">
                    <span>${(file.size / 1024).toFixed(2)} KB</span>
                </div>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

// Classification
async function handleClassify() {
    if (!selectedFile) return;

    showLoading(true);

    try {
        if (selectedModel === 'compare') {
            await handleCompare();
        } else {
            await handleSingleClassification();
        }
    } catch (error) {
        console.error('Classification error:', error);
        showError('Failed to classify image. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function handleSingleClassification() {
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('model', selectedModel);

    const response = await fetch(`${API_BASE_URL}/classify`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Classification failed');
    }

    const result = await response.json();
    displaySingleResult(result);
}

async function handleCompare() {
    const formData = new FormData();
    formData.append('image', selectedFile);

    const response = await fetch(`${API_BASE_URL}/compare`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Comparison failed');
    }

    const result = await response.json();
    displayComparisonResult(result);
}

function displaySingleResult(result) {
    resultsContent.innerHTML = `
        <div class="result-card">
            <div class="result-header">
                <span class="result-badge">${result.model_used} model</span>
                <div class="result-prediction">
                    <h4>Predicted Class</h4>
                    <div class="class-name">${result.predicted_class}</div>
                </div>
                <div class="result-confidence">
                    <div class="confidence-value">${result.confidence.toFixed(1)}%</div>
                    <div class="confidence-label">Confidence</div>
                </div>
            </div>
            
            <div class="result-images">
                <div class="result-image-card">
                    <h5>Original Image</h5>
                    <img src="${result.original_image}" alt="Original">
                </div>
                <div class="result-image-card">
                    <h5>Grad-CAM Visualization</h5>
                    <img src="${result.gradcam_image}" alt="Grad-CAM">
                </div>
            </div>
            
            <div class="top-predictions">
                <h5>Top 5 Predictions</h5>
                ${result.top5.map((pred, idx) => `
                    <div class="prediction-item">
                        <div class="prediction-rank">${idx + 1}</div>
                        <div class="prediction-class">${pred.class}</div>
                        <div class="prediction-bar-container">
                            <div class="prediction-bar" style="width: ${pred.confidence}%"></div>
                        </div>
                        <div class="prediction-value">${pred.confidence.toFixed(1)}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayComparisonResult(result) {
    const baselineHTML = result.baseline ? `
        <div class="result-card">
            <div class="result-header">
                <span class="result-badge">Baseline Model</span>
                <div class="result-prediction">
                    <h4>Predicted Class</h4>
                    <div class="class-name">${result.baseline.predicted_class}</div>
                </div>
                <div class="result-confidence">
                    <div class="confidence-value">${result.baseline.confidence.toFixed(1)}%</div>
                    <div class="confidence-label">Confidence</div>
                </div>
            </div>
            
            <div class="result-images">
                <div class="result-image-card">
                    <h5>Original Image</h5>
                    <img src="${result.baseline.original_image}" alt="Original">
                </div>
                <div class="result-image-card">
                    <h5>Grad-CAM Visualization</h5>
                    <img src="${result.baseline.gradcam_image}" alt="Grad-CAM">
                </div>
            </div>
            
            <div class="top-predictions">
                <h5>Top 5 Predictions</h5>
                ${result.baseline.top5.map((pred, idx) => `
                    <div class="prediction-item">
                        <div class="prediction-rank">${idx + 1}</div>
                        <div class="prediction-class">${pred.class}</div>
                        <div class="prediction-bar-container">
                            <div class="prediction-bar" style="width: ${pred.confidence}%"></div>
                        </div>
                        <div class="prediction-value">${pred.confidence.toFixed(1)}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '<p>Baseline model not available</p>';

    const refinedHTML = result.refined ? `
        <div class="result-card">
            <div class="result-header">
                <span class="result-badge">Refined Model</span>
                <div class="result-prediction">
                    <h4>Predicted Class</h4>
                    <div class="class-name">${result.refined.predicted_class}</div>
                </div>
                <div class="result-confidence">
                    <div class="confidence-value">${result.refined.confidence.toFixed(1)}%</div>
                    <div class="confidence-label">Confidence</div>
                </div>
            </div>
            
            <div class="result-images">
                <div class="result-image-card">
                    <h5>Original Image</h5>
                    <img src="${result.refined.original_image}" alt="Original">
                </div>
                <div class="result-image-card">
                    <h5>Grad-CAM Visualization</h5>
                    <img src="${result.refined.gradcam_image}" alt="Grad-CAM">
                </div>
            </div>
            
            <div class="top-predictions">
                <h5>Top 5 Predictions</h5>
                ${result.refined.top5.map((pred, idx) => `
                    <div class="prediction-item">
                        <div class="prediction-rank">${idx + 1}</div>
                        <div class="prediction-class">${pred.class}</div>
                        <div class="prediction-bar-container">
                            <div class="prediction-bar" style="width: ${pred.confidence}%"></div>
                        </div>
                        <div class="prediction-value">${pred.confidence.toFixed(1)}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '<p>Refined model not available</p>';

    resultsContent.innerHTML = `
        <div class="comparison-grid">
            ${baselineHTML}
            ${refinedHTML}
        </div>
    `;

    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleClear() {
    selectedFile = null;
    fileInput.value = '';
    classifyBtn.disabled = true;
    resultsSection.style.display = 'none';

    uploadArea.innerHTML = `
        <div class="upload-content">
            <div class="upload-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
            </div>
            <h3>Drop your image here</h3>
            <p>or click to browse</p>
            <div class="upload-formats">
                <span>PNG</span>
                <span>JPG</span>
                <span>WEBP</span>
            </div>
        </div>
    `;
}

// Sample Gallery
async function loadSampleGallery() {
    try {
        const response = await fetch(`${API_BASE_URL}/sample-results`);
        const data = await response.json();

        if (data.samples && data.samples.length > 0) {
            displayGallery(data.samples);
        } else {
            galleryGrid.innerHTML = `
                <div class="gallery-loading">
                    <p>No sample results available yet. Train your models first!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load gallery:', error);
        galleryGrid.innerHTML = `
            <div class="gallery-loading">
                <p>Failed to load sample results</p>
            </div>
        `;
    }
}

function displayGallery(samples) {
    galleryGrid.innerHTML = samples.map(sample => {
        const baselineHTML = sample.baseline ? `
            <div class="gallery-item">
                <img src="${sample.baseline}" alt="Baseline Sample ${sample.id}">
                <div class="gallery-item-label">Baseline - Sample ${sample.id + 1}</div>
            </div>
        ` : '';

        const refinedHTML = sample.refined ? `
            <div class="gallery-item">
                <img src="${sample.refined}" alt="Refined Sample ${sample.id}">
                <div class="gallery-item-label">Refined - Sample ${sample.id + 1}</div>
            </div>
        ` : '';

        return baselineHTML + refinedHTML;
    }).join('');
}

// Utility Functions
function showLoading(show) {
    loadingOverlay.classList.toggle('active', show);
}

function showError(message) {
    resultsContent.innerHTML = `
        <div class="result-card" style="text-align: center; padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h3 style="margin-bottom: 1rem;">Error</h3>
            <p style="color: var(--text-secondary);">${message}</p>
        </div>
    `;
    resultsSection.style.display = 'block';
}

// Periodic health check
setInterval(checkServerHealth, 30000); // Check every 30 seconds
