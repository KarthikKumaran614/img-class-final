# Implementation Plan: Explainability-Guided Model Refinement

## Project Overview
**Title:** Improving Image Classification Accuracy Using Explainability-Guided Model Refinement
**Goal:** Enhance CIFAR-10 classification accuracy by using Grad-CAM to identify and refine attention-deficient samples.

## Technology Stack
- **Language:** Python
- **Framework:** PyTorch (selected for flexibility with Grad-CAM hooks)
- **Libraries:** NumPy, Matplotlib, OpenCV (for heatmap overlay), torchvision

## Modules Structure
1. **`src/config.py`**: Configuration settings (hyperparameters, paths).
2. **`src/data_loader.py`**: CIFAR-10 loading, preprocessing, and augmentation pipelines.
3. **`src/model.py`**: Baseline CNN architecture (Custom CNN or simple ResNet18).
4. **`src/train.py`**: Training and validation loops.
5. **`src/gradcam.py`**: Grad-CAM implementation.
6. **`src/analyze_and_refine.py`**: 
    - Loads baseline model.
    - Computes Grad-CAM.
    - Identifies specific samples (incorrect predictions/low confidence).
    - Creates a "refined" dataset (mixing original + augmented versions of hard samples).
7. **`src/utils.py`**: Visualization tools (plotting heatmaps, confusion matrix).
8. **`main.py`**: Master script to run the full workflow.

## Detailed Steps

### Phase 1: Setup & Baseline
- [ ] Create virtual environment setup (requirements.txt).
- [ ] Implement `src/model.py` (Simple CNN).
- [ ] Implement `src/data_loader.py`.
- [ ] Implement `src/train.py` to train the baseline model and save weights.

### Phase 2: Explainability (Grad-CAM)
- [ ] Implement `GradCAM` class in `src/gradcam.py`.
- [ ] Create visualization functions to overlay heatmaps on images.

### Phase 3: Refinement Strategy
- [ ] **Identification**: Run inference on the training set. Identify samples where:
    - The model predicts incorrectly.
    - (Optionally) assessing "attention deficiency" via heuristic if possible, otherwise focus on misclassified samples as proxies for "confused" attention.
- [ ] **Augmentation**: Apply targeted augmentations (rotation, scaling, noise) specifically to these hard samples to help the model learn better features.
- [ ] **Dataset merging**: specific strategy to mix these back in or upweight them.

### Phase 4: Retraining & Evaluation
- [ ] Train a new model (initialized with baseline weights or from scratch) on the refined dataset.
- [ ] Evaluate both models on the Test Set.
- [ ] Generate comparison metrics: Accuracy, Confusion Matrix, and Side-by-Side Grad-CAM visualizations.

## Timeline
- **Step 1**: Architecture & Baseline Training.
- **Step 2**: Grad-CAM Implementation.
- **Step 3**: Refinement Logic & Retraining.
- **Step 4**: Final Reporting/Visualization.
