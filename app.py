from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import torch
import os
import base64
import io
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
from src.config import *
from src.model import SimpleCNN, ResNet18CIFAR
from src.gradcam import GradCAM
from src.utils import unnormalize, show_cam_on_image
import cv2

app = Flask(__name__, static_folder='frontend/dist', static_url_path='')
CORS(app)

# Global variables for models
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
baseline_model = None
refined_model = None
grad_cam_baseline = None
grad_cam_refined = None

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((32, 32)),
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
])

def load_models():
    """Load both baseline and refined models"""
    global baseline_model, refined_model, grad_cam_baseline, grad_cam_refined
    
    print(f"Loading models on {device}...")
    
    # Determine model type and paths
    if MODEL_TYPE == 'resnet18':
        baseline_model = ResNet18CIFAR(num_classes=NUM_CLASSES).to(device)
        refined_model = ResNet18CIFAR(num_classes=NUM_CLASSES).to(device)
        baseline_path = RESNET_BASELINE_PATH
        refined_path = RESNET_REFINED_PATH
    else:
        baseline_model = SimpleCNN(num_classes=NUM_CLASSES).to(device)
        refined_model = SimpleCNN(num_classes=NUM_CLASSES).to(device)
        baseline_path = MODEL_SAVE_PATH
        refined_path = REFINED_MODEL_SAVE_PATH
    
    # Load baseline model
    if os.path.exists(baseline_path):
        baseline_model.load_state_dict(torch.load(baseline_path, map_location=device))
        baseline_model.eval()
        grad_cam_baseline = GradCAM(baseline_model, baseline_model.get_last_conv_layer())
        print(f"[OK] Baseline model loaded from {baseline_path}")
    else:
        print(f"[X] Baseline model not found at {baseline_path}")
    
    # Load refined model
    if os.path.exists(refined_path):
        refined_model.load_state_dict(torch.load(refined_path, map_location=device))
        refined_model.eval()
        grad_cam_refined = GradCAM(refined_model, refined_model.get_last_conv_layer())
        print(f"[OK] Refined model loaded from {refined_path}")
    else:
        print(f"[X] Refined model not found at {refined_path}")

def image_to_base64(img_array):
    """Convert numpy array to base64 string"""
    img_array = (img_array * 255).astype(np.uint8)
    if len(img_array.shape) == 2:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
    elif img_array.shape[2] == 1:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
    
    img = Image.fromarray(img_array)
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

def predict_with_gradcam(model, grad_cam, img_tensor):
    """Get prediction and Grad-CAM visualization"""
    with torch.no_grad():
        outputs = model(img_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
    
    # Generate Grad-CAM
    mask, pred_class = grad_cam(img_tensor)
    
    # Get original image
    original_img = unnormalize(img_tensor)
    cam_vis = show_cam_on_image(original_img, mask)
    
    # Convert to base64
    original_b64 = image_to_base64(original_img)
    gradcam_b64 = image_to_base64(cam_vis)
    
    # Get top 5 predictions
    top5_prob, top5_idx = torch.topk(probabilities[0], 5)
    top5_predictions = [
        {"class": CLASSES[idx.item()], "confidence": prob.item() * 100}
        for idx, prob in zip(top5_idx, top5_prob)
    ]
    
    return {
        "predicted_class": CLASSES[predicted.item()],
        "confidence": confidence.item() * 100,
        "top5": top5_predictions,
        "original_image": original_b64,
        "gradcam_image": gradcam_b64
    }

@app.route('/')
def index():
    """Serve the frontend"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "device": str(device),
        "model_type": MODEL_TYPE,
        "baseline_loaded": baseline_model is not None,
        "refined_loaded": refined_model is not None
    })

@app.route('/api/classify', methods=['POST'])
def classify():
    """Classify an uploaded image"""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        file = request.files['image']
        model_type = request.form.get('model', 'baseline')  # 'baseline' or 'refined'
        
        # Read and preprocess image
        img = Image.open(file.stream).convert('RGB')
        img_tensor = transform(img).unsqueeze(0).to(device)
        
        # Select model
        if model_type == 'refined' and refined_model is not None:
            model = refined_model
            grad_cam = grad_cam_refined
        else:
            model = baseline_model
            grad_cam = grad_cam_baseline
        
        if model is None:
            return jsonify({"error": f"{model_type} model not loaded"}), 500
        
        # Get prediction and Grad-CAM
        result = predict_with_gradcam(model, grad_cam, img_tensor)
        result["model_used"] = model_type
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/compare', methods=['POST'])
def compare():
    """Compare baseline and refined models on the same image"""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        file = request.files['image']
        
        # Read and preprocess image
        img = Image.open(file.stream).convert('RGB')
        img_tensor = transform(img).unsqueeze(0).to(device)
        
        # Get predictions from both models
        baseline_result = None
        refined_result = None
        
        if baseline_model is not None:
            baseline_result = predict_with_gradcam(baseline_model, grad_cam_baseline, img_tensor)
            baseline_result["model_used"] = "baseline"
        
        if refined_model is not None:
            refined_result = predict_with_gradcam(refined_model, grad_cam_refined, img_tensor)
            refined_result["model_used"] = "refined"
        
        return jsonify({
            "baseline": baseline_result,
            "refined": refined_result
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get information about the models"""
    return jsonify({
        "model_type": MODEL_TYPE,
        "classes": CLASSES,
        "num_classes": NUM_CLASSES,
        "device": str(device),
        "baseline_available": baseline_model is not None,
        "refined_available": refined_model is not None
    })

@app.route('/api/sample-results', methods=['GET'])
def sample_results():
    """Get sample Grad-CAM results from outputs folder"""
    try:
        samples = []
        output_dir = OUTPUT_DIR
        
        # Look for baseline and refined gradcam images
        for i in range(5):
            baseline_path = os.path.join(output_dir, f'baseline_gradcam_{i}.png')
            refined_path = os.path.join(output_dir, f'refined_gradcam_{i}.png')
            
            sample = {"id": i}
            
            if os.path.exists(baseline_path):
                with open(baseline_path, 'rb') as f:
                    img_data = base64.b64encode(f.read()).decode()
                    sample["baseline"] = f"data:image/png;base64,{img_data}"
            
            if os.path.exists(refined_path):
                with open(refined_path, 'rb') as f:
                    img_data = base64.b64encode(f.read()).decode()
                    sample["refined"] = f"data:image/png;base64,{img_data}"
            
            if "baseline" in sample or "refined" in sample:
                samples.append(sample)
        
        return jsonify({"samples": samples})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    load_models()
    print("\n" + "="*60)
    print("Starting CIFAR-10 Classification Server")
    print("="*60)
    print(f"Model Type: {MODEL_TYPE}")
    print(f"Device: {device}")
    print(f"Server running at http://localhost:5000")
    print("="*60 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
