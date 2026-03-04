import torch
from torch.utils.data import Dataset, ConcatDataset
import torchvision.transforms as transforms
import copy
from tqdm import tqdm
from .gradcam import GradCAM
from .utils import unnormalize

class RefinedDataset(Dataset):
    def __init__(self, original_dataset, indices_to_augment, augment_transform=None):
        self.original_dataset = original_dataset
        self.indices = indices_to_augment
        
        if augment_transform is None:
            self.augment_transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.RandomHorizontalFlip(p=1.0), # Force flip
                transforms.RandomRotation(15),
                transforms.ColorJitter(brightness=0.2, contrast=0.2),
                transforms.ToTensor(),
                transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
            ])
        else:
            self.augment_transform = augment_transform
            
        self.augmented_data = []
        self._prepare_augmented_data()

    def _prepare_augmented_data(self):
        print("Preparing augmented data for refinement...")
        for idx in self.indices:
            img, label = self.original_dataset[idx]
            # img is a normalized tensor (C, H, W)
            # Unnormalize it to get numpy array (H, W, C) in [0, 1]
            
            img_np = unnormalize(img)  # Returns (H, W, C) in [0, 1]
            img_uint8 = (img_np * 255).astype('uint8')
            
            # Apply augmentation
            aug_img = self.augment_transform(img_uint8)
            self.augmented_data.append((aug_img, label))

    def __len__(self):
        return len(self.augmented_data)

    def __getitem__(self, idx):
        return self.augmented_data[idx]

def identify_attention_deficient_samples(model, dataloader, device):
    """
    Returns indices of samples that are misclassified.
    Could also use GradCAM statistics here (e.g. low entropy cam) but keeping it simple for stability.
    """
    model.eval()
    misclassified_indices = []
    
    print("Identifying samples for refinement (Misclassified)...")
    with torch.no_grad():
        for i, (inputs, labels) in enumerate(tqdm(dataloader)):
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, predicted = torch.max(outputs, 1)
            
            # This logic assumes dataloader is NOT shuffled and index i matches dataset index.
            # Standard Dataloader with shuffle=False ensures order.
            # However, batch index needs to be mapped to global index.
            batch_size = inputs.size(0)
            start_idx = i * batch_size
            
            for j in range(batch_size):
                if j >= inputs.size(0): break # last batch safety
                if predicted[j] != labels[j]:
                    misclassified_indices.append(start_idx + j)
                    
    print(f"Found {len(misclassified_indices)} samples to refine.")
    return misclassified_indices

def get_refined_dataloader(original_dataset, misclassified_indices, batch_size):
    refined_subset = RefinedDataset(original_dataset, misclassified_indices)
    
    # Combine original + refined
    full_dataset = ConcatDataset([original_dataset, refined_subset])
    
    trainloader = torch.utils.data.DataLoader(full_dataset, batch_size=batch_size,
                                              shuffle=True, num_workers=2)
    return trainloader
