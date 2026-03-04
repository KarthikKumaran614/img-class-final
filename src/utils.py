import cv2
import numpy as np
import matplotlib.pyplot as plt
import torch

def unnormalize(tensor):
    """
    Unnormalize a tensor image (C, H, W) or (B, C, H, W) to numpy (H, W, C) in range [0, 1]
    Assumes mean=0.5, std=0.5 normalization
    """
    # Handle batched tensors by squeezing if batch size is 1
    if tensor.dim() == 4 and tensor.size(0) == 1:
        tensor = tensor.squeeze(0)
    
    img = tensor.cpu().numpy().transpose(1, 2, 0)
    img = img * 0.5 + 0.5
    img = np.clip(img, 0, 1)
    return img

def show_cam_on_image(img, mask):
    """
    img: numpy array (H, W, C) in [0, 1]
    mask: numpy array (H, W) in [0, 1]
    """
    heatmap = cv2.applyColorMap(np.uint8(255 * mask), cv2.COLORMAP_JET)
    heatmap = np.float32(heatmap) / 255
    cam = heatmap + np.float32(img)
    cam = cam / np.max(cam)
    return np.uint8(255 * cam)

def plot_gradcam(original_img, cam_img, pred_class, true_class=None, save_path=None):
    fig, ax = plt.subplots(1, 2, figsize=(10, 5))
    ax[0].imshow(original_img)
    ax[0].set_title(f"Original (True: {true_class})")
    ax[0].axis('off')
    
    ax[1].imshow(cam_img)
    ax[1].set_title(f"Grad-CAM (Pred: {pred_class})")
    ax[1].axis('off')
    
    if save_path:
        plt.savefig(save_path)
        plt.close()
    else:
        plt.show()
