import torch
import os
import random
import matplotlib.pyplot as plt
from src.config import *
from src.model import SimpleCNN, ResNet18CIFAR
from src.data_loader import get_data_loaders
from src.train import train_model, evaluate_model
from src.gradcam import GradCAM
from src.utils import unnormalize, show_cam_on_image, plot_gradcam
from src.refinement import identify_attention_deficient_samples, get_refined_dataloader

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Running on {device}")
    print(f"Using model: {MODEL_TYPE}")

    # 1. Load Data
    trainloader, testloader, trainset, testset = get_data_loaders(BATCH_SIZE)

    # 2. Baseline Model - Select based on configuration
    if MODEL_TYPE == 'resnet18':
        baseline_model = ResNet18CIFAR(num_classes=NUM_CLASSES).to(device)
        model_path = RESNET_BASELINE_PATH
        refined_path = RESNET_REFINED_PATH
    else:
        baseline_model = SimpleCNN(num_classes=NUM_CLASSES).to(device)
        model_path = MODEL_SAVE_PATH
        refined_path = REFINED_MODEL_SAVE_PATH
    
    if os.path.exists(model_path):
        print(f"Loading existing {MODEL_TYPE} baseline model...")
        baseline_model.load_state_dict(torch.load(model_path))
    else:
        print(f"Training {MODEL_TYPE} baseline model...")
        baseline_model = train_model(baseline_model, trainloader, testloader, save_path=model_path)

    baseline_acc = evaluate_model(baseline_model, testloader, device)
    print(f"Baseline Accuracy: {baseline_acc:.2f}%")

    # 3. Explainability (Grad-CAM)
    grad_cam = GradCAM(baseline_model, baseline_model.get_last_conv_layer())
    
    # Visualize a few test samples
    print("Generating Grad-CAMs for random test samples...")
    dataiter = iter(testloader)
    images, labels = next(dataiter)
    images = images[:5].to(device)
    labels = labels[:5]
    
    for i in range(5):
        img_tensor = images[i].unsqueeze(0)
        mask, pred_class = grad_cam(img_tensor)
        
        original_img = unnormalize(img_tensor)
        cam_vis = show_cam_on_image(original_img, mask)
        
        save_path = os.path.join(OUTPUT_DIR, f'baseline_gradcam_{i}.png')
        plot_gradcam(original_img, cam_vis, CLASSES[pred_class], CLASSES[labels[i]], save_path)
    
    # 4. Refinement
    # Identify attention deficient samples from TRAINING set to improve the model
    # We need a non-shuffled trainloader for index mapping
    trainloader_seq = torch.utils.data.DataLoader(trainset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
    
    bad_indices = identify_attention_deficient_samples(baseline_model, trainloader_seq, device)
    
    if not bad_indices:
        print("No samples to refine! Model is perfect (doubtful) or logic error.")
        return

    # 5. Retrain with Refinement
    print("Retraining with attention-guided refinement...")
    refined_loader = get_refined_dataloader(trainset, bad_indices, BATCH_SIZE)
    
    # Create refined model of same type as baseline
    if MODEL_TYPE == 'resnet18':
        refined_model = ResNet18CIFAR(num_classes=NUM_CLASSES).to(device)
    else:
        refined_model = SimpleCNN(num_classes=NUM_CLASSES).to(device)
    
    # Initialize with baseline weights
    refined_model.load_state_dict(baseline_model.state_dict())
    
    refined_model = train_model(refined_model, refined_loader, testloader, 
                                epochs=REFINEMENT_EPOCHS, save_path=refined_path)
    
    refined_acc = evaluate_model(refined_model, testloader, device)
    print(f"Refined Model Accuracy: {refined_acc:.2f}%")
    print(f"Improvement: {refined_acc - baseline_acc:.2f}%")
    
    # 6. Final Visual Comparison
    # Pick a sample that was misclassified by baseline but likely fixed
    # For now, just redo the 5 test samples
    print("Generating Refined Grad-CAMs...")
    grad_cam_refined = GradCAM(refined_model, refined_model.get_last_conv_layer())
    
    for i in range(5):
        img_tensor = images[i].unsqueeze(0)
        mask, pred_class = grad_cam_refined(img_tensor)
        
        original_img = unnormalize(img_tensor)
        cam_vis = show_cam_on_image(original_img, mask)
        
        save_path = os.path.join(OUTPUT_DIR, f'refined_gradcam_{i}.png')
        plot_gradcam(original_img, cam_vis, CLASSES[pred_class], CLASSES[labels[i]], save_path)

if __name__ == "__main__":
    main()
