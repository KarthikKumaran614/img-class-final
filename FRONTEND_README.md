# CIFAR-10 Explainable AI Classifier - Frontend

A stunning, modern web interface for the CIFAR-10 image classification system with Grad-CAM explainability visualizations.

## ✨ Features

- 🎨 **Premium Dark Mode Design** - Modern gradient aesthetics with smooth animations
- 🖼️ **Drag & Drop Upload** - Intuitive image upload with visual feedback
- 🔍 **Real-time Classification** - Instant predictions with confidence scores
- 🎯 **Grad-CAM Visualization** - See exactly what the AI focuses on
- ⚖️ **Model Comparison** - Compare baseline vs refined model performance
- 📊 **Top-5 Predictions** - View all top predictions with confidence bars
- 🖼️ **Sample Gallery** - Explore pre-generated results from test dataset
- 📱 **Fully Responsive** - Works perfectly on all devices

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- PyTorch & TorchVision (Deep Learning)
- Flask & Flask-CORS (Web Server)
- NumPy, OpenCV, Pillow (Image Processing)
- Matplotlib, scikit-learn (Visualization & Metrics)

### 2. Ensure Models are Trained

Before running the frontend, make sure you have trained models:

```bash
python main.py
```

This creates:
- `outputs/baseline_model.pth` or `outputs/resnet_baseline.pth`
- `outputs/refined_model.pth` or `outputs/resnet_refined.pth`
- Sample Grad-CAM visualizations in `outputs/`

### 3. Start the Server

```bash
python app.py
```

The server will start at: **http://localhost:5000**

### 4. Open in Browser

Navigate to `http://localhost:5000` in your web browser.

## 📁 Project Structure

```
CCP-Image-Classification/
├── app.py                  # Flask backend API server
├── frontend/
│   ├── dist/              # Production build
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── script.js
│   ├── index.html         # Main HTML structure
│   ├── styles.css         # Modern CSS with animations
│   └── script.js          # Frontend JavaScript logic
├── src/                   # ML model code
│   ├── model.py
│   ├── gradcam.py
│   └── ...
├── outputs/               # Model weights & visualizations
└── requirements.txt       # Python dependencies
```

## 🎯 How to Use

### Upload & Classify

1. **Select an Image**: Click the upload area or drag & drop an image
2. **Choose Model**: 
   - **Baseline Model** - Original trained model
   - **Refined Model** - Attention-guided refined model
   - **Compare Both** - Side-by-side comparison
3. **Classify**: Click "Classify Image" button
4. **View Results**: See predictions, confidence scores, and Grad-CAM visualizations

### Understanding Results

- **Predicted Class**: The model's top prediction
- **Confidence**: How certain the model is (0-100%)
- **Original Image**: Your uploaded image (resized to 32x32)
- **Grad-CAM**: Heatmap showing where the model focuses
- **Top 5 Predictions**: All top predictions with confidence bars

### Grad-CAM Interpretation

- 🔴 **Red/Yellow areas**: High attention - model focuses here
- 🔵 **Blue/Purple areas**: Low attention - model ignores these
- The heatmap reveals what features the model uses for classification

## 🎨 Design Features

### Modern Aesthetics
- Dark mode with vibrant gradient accents
- Smooth micro-animations on hover
- Glassmorphism effects with backdrop blur
- Premium color palette (HSL-based)

### User Experience
- Instant visual feedback on all interactions
- Loading states with elegant spinners
- Responsive grid layouts
- Accessible keyboard navigation

### Performance
- Optimized image processing
- Efficient API communication
- Lazy loading for gallery images
- Smooth 60fps animations

## 🔧 API Endpoints

The Flask backend provides these endpoints:

### `GET /api/health`
Check server status and model availability

**Response:**
```json
{
  "status": "healthy",
  "device": "cuda",
  "model_type": "resnet18",
  "baseline_loaded": true,
  "refined_loaded": true
}
```

### `POST /api/classify`
Classify a single image with selected model

**Request:**
- `image`: Image file (multipart/form-data)
- `model`: "baseline" or "refined"

**Response:**
```json
{
  "predicted_class": "cat",
  "confidence": 87.5,
  "top5": [...],
  "original_image": "data:image/png;base64,...",
  "gradcam_image": "data:image/png;base64,...",
  "model_used": "baseline"
}
```

### `POST /api/compare`
Compare both models on the same image

**Request:**
- `image`: Image file (multipart/form-data)

**Response:**
```json
{
  "baseline": { /* classification result */ },
  "refined": { /* classification result */ }
}
```

### `GET /api/sample-results`
Get pre-generated sample visualizations

**Response:**
```json
{
  "samples": [
    {
      "id": 0,
      "baseline": "data:image/png;base64,...",
      "refined": "data:image/png;base64,..."
    }
  ]
}
```

### `GET /api/model-info`
Get model configuration information

**Response:**
```json
{
  "model_type": "resnet18",
  "classes": ["airplane", "automobile", ...],
  "num_classes": 10,
  "device": "cuda",
  "baseline_available": true,
  "refined_available": true
}
```

## 🎓 CIFAR-10 Classes

The model can classify these 10 object categories:

1. ✈️ Airplane
2. 🚗 Automobile
3. 🐦 Bird
4. 🐱 Cat
5. 🦌 Deer
6. 🐕 Dog
7. 🐸 Frog
8. 🐴 Horse
9. 🚢 Ship
10. 🚚 Truck

## 🔬 Technology Stack

### Frontend
- **HTML5** - Semantic structure
- **CSS3** - Modern styling with CSS Grid & Flexbox
- **Vanilla JavaScript** - No frameworks, pure performance
- **Google Fonts** - Inter & JetBrains Mono

### Backend
- **Flask** - Lightweight Python web framework
- **PyTorch** - Deep learning inference
- **OpenCV** - Image processing
- **NumPy** - Numerical operations

## 🎯 Performance Tips

### For Best Results
- Use clear, well-lit images
- Images should contain one primary object
- CIFAR-10 works best with the 10 supported classes
- Higher resolution images are automatically resized

### Server Performance
- GPU acceleration (CUDA) if available
- Automatic model caching
- Efficient base64 encoding for images
- CORS enabled for development

## 🐛 Troubleshooting

### Server Won't Start
- Check if port 5000 is available
- Ensure all dependencies are installed
- Verify models exist in `outputs/` folder

### Models Not Loading
- Run `python main.py` to train models first
- Check file paths in `src/config.py`
- Verify model files aren't corrupted

### Classification Fails
- Ensure image is valid format (PNG, JPG, WEBP)
- Check server logs for errors
- Verify models are loaded (check health endpoint)

### Gallery Not Loading
- Run training to generate sample visualizations
- Check `outputs/` folder for gradcam images
- Ensure server has read permissions

## 📝 Development

### Running in Development Mode

The Flask server runs in debug mode by default:

```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

This enables:
- Auto-reload on code changes
- Detailed error messages
- CORS for local development

### Customizing the Frontend

**Colors**: Edit CSS variables in `styles.css`:
```css
:root {
    --primary: hsl(250, 84%, 54%);
    --secondary: hsl(280, 84%, 54%);
    /* ... */
}
```

**API URL**: Edit in `script.js`:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## 🚀 Deployment

For production deployment:

1. **Disable Debug Mode** in `app.py`:
   ```python
   app.run(debug=False, host='0.0.0.0', port=5000)
   ```

2. **Use Production Server** (e.g., Gunicorn):
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. **Set Up Reverse Proxy** (e.g., Nginx)

4. **Enable HTTPS** for secure connections

## 📊 Model Performance

Based on CIFAR-10 test set:

- **Baseline Accuracy**: ~79.35%
- **Refined Accuracy**: ~79.29%
- **Best Classes**: Car (92.9%), Ship (82.4%), Truck (85.3%)
- **Challenging Classes**: Bird (60.4%), Cat (64.4%)

## 🤝 Contributing

This is a research/educational project. Feel free to:
- Experiment with different models
- Improve the UI/UX
- Add new visualization techniques
- Optimize performance

## 📄 License

This project is for educational purposes. Model architecture and training code based on PyTorch tutorials.

## 🙏 Acknowledgments

- **CIFAR-10 Dataset**: Alex Krizhevsky, Vinod Nair, and Geoffrey Hinton
- **Grad-CAM**: Selvaraju et al., "Grad-CAM: Visual Explanations from Deep Networks"
- **PyTorch**: Facebook AI Research
- **Design Inspiration**: Modern web design best practices

---

**Built with ❤️ for Explainable AI**

For questions or issues, check the main project documentation or open an issue.
