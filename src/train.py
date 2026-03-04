import torch
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm
from .config import LEARNING_RATE, EPOCHS, MODEL_SAVE_PATH, USE_SCHEDULER, WEIGHT_DECAY

def train_model(model, trainloader, testloader, epochs=EPOCHS, lr=LEARNING_RATE, save_path=MODEL_SAVE_PATH):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=lr, momentum=0.9, weight_decay=WEIGHT_DECAY)
    
    # Learning rate scheduler
    scheduler = None
    if USE_SCHEDULER:
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', 
                                                         factor=0.1, patience=5)

    print(f"Training on {device}...")
    best_acc = 0.0
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        progress_bar = tqdm(trainloader, desc=f"Epoch {epoch+1}/{epochs}")
        for i, data in enumerate(progress_bar):
            inputs, labels = data
            inputs, labels = inputs.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            progress_bar.set_postfix({'Loss': running_loss / (i+1), 'Acc': 100 * correct / total})

        # Validation
        val_acc = evaluate_model(model, testloader, device)
        print(f"Epoch {epoch+1} finished. Validation Accuracy: {val_acc:.2f}%")
        
        # Update learning rate based on validation accuracy
        if scheduler:
            scheduler.step(val_acc)
        
        # Save best model
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), save_path)
            print(f"New best model saved! Accuracy: {best_acc:.2f}%")

    print("Finished Training")
    print(f"Best validation accuracy: {best_acc:.2f}%")
    print(f"Model saved to {save_path}")
    return model

def evaluate_model(model, testloader, device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for data in testloader:
            images, labels = data
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
    
    acc = 100 * correct / total
    return acc
