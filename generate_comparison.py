import torch
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
from src.config import *
from src.model import SimpleCNN
from src.data_loader import get_data_loaders
from src.train import evaluate_model

def plot_confusion_matrix(model, testloader, device, title, save_path):
    """Generate and plot confusion matrix"""
    model.eval()
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in testloader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            _, predicted = torch.max(outputs, 1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.numpy())
    
    cm = confusion_matrix(all_labels, all_preds)
    
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=CLASSES, yticklabels=CLASSES)
    plt.title(title)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()
    
    return cm, all_preds, all_labels

def generate_comparison_report():
    """Generate comprehensive comparison between baseline and refined models"""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Load data
    _, testloader, _, _ = get_data_loaders(BATCH_SIZE)
    
    # Load models
    baseline_model = SimpleCNN(num_classes=NUM_CLASSES).to(device)
    baseline_model.load_state_dict(torch.load(MODEL_SAVE_PATH))
    
    refined_model = SimpleCNN(num_classes=NUM_CLASSES).to(device)
    refined_model.load_state_dict(torch.load(REFINED_MODEL_SAVE_PATH))
    
    print("Generating Baseline Confusion Matrix...")
    cm_baseline, preds_baseline, labels = plot_confusion_matrix(
        baseline_model, testloader, device,
        "Baseline Model Confusion Matrix (79.35%)",
        os.path.join(OUTPUT_DIR, 'baseline_confusion_matrix.png')
    )
    
    print("Generating Refined Confusion Matrix...")
    cm_refined, preds_refined, _ = plot_confusion_matrix(
        refined_model, testloader, device,
        "Refined Model Confusion Matrix (79.29%)",
        os.path.join(OUTPUT_DIR, 'refined_confusion_matrix.png')
    )
    
    # Generate classification reports
    print("\n" + "="*60)
    print("BASELINE MODEL CLASSIFICATION REPORT")
    print("="*60)
    print(classification_report(labels, preds_baseline, target_names=CLASSES))
    
    print("\n" + "="*60)
    print("REFINED MODEL CLASSIFICATION REPORT")
    print("="*60)
    print(classification_report(labels, preds_refined, target_names=CLASSES))
    
    # Per-class accuracy comparison
    baseline_acc_per_class = cm_baseline.diagonal() / cm_baseline.sum(axis=1)
    refined_acc_per_class = cm_refined.diagonal() / cm_refined.sum(axis=1)
    
    plt.figure(figsize=(12, 6))
    x = np.arange(len(CLASSES))
    width = 0.35
    
    plt.bar(x - width/2, baseline_acc_per_class * 100, width, label='Baseline', alpha=0.8)
    plt.bar(x + width/2, refined_acc_per_class * 100, width, label='Refined', alpha=0.8)
    
    plt.xlabel('Class')
    plt.ylabel('Accuracy (%)')
    plt.title('Per-Class Accuracy Comparison')
    plt.xticks(x, CLASSES, rotation=45)
    plt.legend()
    plt.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'per_class_accuracy_comparison.png'), dpi=150)
    plt.close()
    
    print("\n" + "="*60)
    print("PER-CLASS ACCURACY COMPARISON")
    print("="*60)
    print(f"{'Class':<12} {'Baseline':<12} {'Refined':<12} {'Change':<12}")
    print("-"*60)
    for i, class_name in enumerate(CLASSES):
        change = (refined_acc_per_class[i] - baseline_acc_per_class[i]) * 100
        print(f"{class_name:<12} {baseline_acc_per_class[i]*100:>10.2f}%  {refined_acc_per_class[i]*100:>10.2f}%  {change:>+10.2f}%")
    
    print("\n✅ Comparison report generated successfully!")
    print(f"📊 Outputs saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    generate_comparison_report()
