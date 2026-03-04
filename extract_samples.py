"""
Extract sample images from CIFAR-10 dataset for testing the web interface
"""
import torch
import torchvision
import torchvision.transforms as transforms
from PIL import Image
import os

# Create output directory
os.makedirs('test_images', exist_ok=True)

# CIFAR-10 classes
classes = ['airplane', 'automobile', 'bird', 'cat', 'deer', 
           'dog', 'frog', 'horse', 'ship', 'truck']

# Load CIFAR-10 test set (without normalization for saving)
transform = transforms.Compose([
    transforms.ToTensor(),
])

print("Loading CIFAR-10 test dataset...")
testset = torchvision.datasets.CIFAR10(root='./data', train=False,
                                       download=True, transform=transform)

# Extract one sample image per class
samples_per_class = {}
for idx, (image, label) in enumerate(testset):
    class_name = classes[label]
    
    # Get first occurrence of each class
    if class_name not in samples_per_class:
        # Convert tensor to PIL Image
        img_array = image.numpy().transpose(1, 2, 0)  # CHW to HWC
        img_array = (img_array * 255).astype('uint8')
        pil_image = Image.fromarray(img_array)
        
        # Save the image
        filename = f'test_images/{class_name}_sample.png'
        pil_image.save(filename)
        samples_per_class[class_name] = idx
        
        print(f"[OK] Saved {filename}")
        
        # Stop when we have all 10 classes
        if len(samples_per_class) == 10:
            break

print(f"\n[OK] Successfully extracted {len(samples_per_class)} sample images!")
print(f"[OK] Images saved in: test_images/")
print("\nYou can now upload these images to test the web interface:")
for class_name in classes:
    print(f"  - {class_name}_sample.png")
