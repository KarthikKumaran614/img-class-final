import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
OUTPUT_DIR = os.path.join(BASE_DIR, 'outputs')
MODEL_SAVE_PATH = os.path.join(OUTPUT_DIR, 'baseline_model.pth')
REFINED_MODEL_SAVE_PATH = os.path.join(OUTPUT_DIR, 'refined_model.pth')
RESNET_BASELINE_PATH = os.path.join(OUTPUT_DIR, 'resnet_baseline.pth')
RESNET_REFINED_PATH = os.path.join(OUTPUT_DIR, 'resnet_refined.pth')

# Model Selection
MODEL_TYPE = 'simplecnn'  # Options: 'simplecnn' or 'resnet18'

# Hyperparameters
BATCH_SIZE = 64
LEARNING_RATE = 0.01  # Higher for ResNet
EPOCHS = 8  # Reduced for 1-hour deadline (was 20)
REFINEMENT_EPOCHS = 5  # Epochs for refinement training
NUM_CLASSES = 10

# Training settings
USE_SCHEDULER = True  # Use learning rate scheduler
WEIGHT_DECAY = 5e-4  # L2 regularization

# Dataset
CLASSES = ('plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck')

