import torch
import torch.nn.functional as F
import numpy as np
import cv2

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_backward_hook(self.save_gradient)

    def save_activation(self, module, input, output):
        self.activations = output

    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def __call__(self, x, class_idx=None):
        # Forward pass
        output = self.model(x)
        
        if class_idx is None:
            class_idx = torch.argmax(output, dim=1)
            
        # Zero grads
        self.model.zero_grad()
        
        # Target for backprop
        one_hot_output = torch.FloatTensor(1, output.size()[-1]).zero_().to(x.device)
        one_hot_output[0][class_idx] = 1
        
        # Backward pass
        output.backward(gradient=one_hot_output, retain_graph=True)
        
        # Get gradients and activations
        guided_gradients = self.gradients.data.cpu().numpy()[0]
        target = self.activations.data.cpu().numpy()[0]
        
        # Global average pooling of gradients
        weights = np.mean(guided_gradients, axis=(1, 2))
        
        # Weighted combination of activation maps
        cam = np.zeros(target.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * target[i, :, :]
            
        # ReLU
        cam = np.maximum(cam, 0)
        
        # Resize to input image size (32x32 for CIFAR)
        cam = cv2.resize(cam, (x.shape[2], x.shape[3]))
        
        # Normalize
        cam = cam - np.min(cam)
        cam = cam / (np.max(cam) + 1e-8) # Avoid div by zero
        
        return cam, int(class_idx)
