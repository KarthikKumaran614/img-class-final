# Improving Image Classification Accuracy Using Explainability-Guided Model Refinement

## Overview
This project demonstrates how to improve a CNN image classifier (trained on CIFAR-10) by using **Grad-CAM** (Gradient-weighted Class Activation Mapping) to identify and refine "attention-deficient" or misclassified samples.

## Workflow
1. **Train Baseline**: A simple CNN is trained on CIFAR-10.
2. **Explainability**: Grad-CAM visualizes which parts of the image the model focuses on.
3. **Refinement**:
    - The system identifies training samples that are misclassified.
    - These samples undergo targeted data augmentation (rotation, jitter).
    - They are mixed back into the training set.
4. **Retrain**: The model is fine-tuned on this enriched dataset.
5. **Evaluate**: Accuracy improvement is reported.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the pipeline:
   ```bash
   python main.py
   ```

## Output
- **Console**: Training logs, accuracy metrics.
- **`outputs/`**:
    - Model checkpoints (`baseline_model.pth`, `refined_model.pth`).
    - Grad-CAM visualizations (images showing heatmaps).

## Structure
- `src/`: Source code for model, training, Grad-CAM, and refinement logic.
- `data/`: CIFAR-10 dataset (downloaded automatically).
- `outputs/`: Results.
