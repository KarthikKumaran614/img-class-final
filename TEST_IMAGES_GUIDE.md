# 🎯 Sample Test Images - Quick Reference

## ✅ Successfully Generated!

I've extracted **10 sample images** from your CIFAR-10 test dataset. These are real images that your model was tested on!

## 📁 Location

All sample images are in: `test_images/`

Full path: `C:\Users\Kishore kalkin\OneDrive\Desktop\StudentDropoutProject\frontend\CCP-Image-Classification\test_images\`

## 🖼️ Available Test Images

You can upload any of these to test your web interface:

1. **airplane_sample.png** - ✈️ Airplane
2. **automobile_sample.png** - 🚗 Car/Automobile  
3. **bird_sample.png** - 🐦 Bird
4. **cat_sample.png** - 🐱 Cat
5. **deer_sample.png** - 🦌 Deer
6. **dog_sample.png** - 🐕 Dog
7. **frog_sample.png** - 🐸 Frog
8. **horse_sample.png** - 🐴 Horse
9. **ship_sample.png** - 🚢 Ship
10. **truck_sample.png** - 🚚 Truck

## 🚀 How to Test

### Step 1: Open the Web Interface
Navigate to: **http://localhost:5000**

### Step 2: Upload an Image
- Click the upload area OR drag & drop
- Browse to `test_images/` folder
- Select any of the sample images

### Step 3: Choose Model
- Select **"Baseline Model"** (currently loaded)
- Or try **"Compare Both"** when refined model is available

### Step 4: Classify
- Click **"Classify Image"** button
- Wait for results (should be instant on CPU)

### Step 5: View Results
You'll see:
- ✅ **Predicted Class** - What the model thinks it is
- 📊 **Confidence Score** - How sure the model is (0-100%)
- 🖼️ **Original Image** - Your uploaded image (32x32)
- 🔥 **Grad-CAM Heatmap** - Where the model focuses attention
- 📈 **Top 5 Predictions** - All top predictions with bars

## 🎨 What to Expect

### Grad-CAM Colors
- 🔴 **Red/Yellow** = High attention (model focuses here)
- 🟢 **Green** = Medium attention
- 🔵 **Blue/Purple** = Low attention (model ignores)

### Example Results
For `cat_sample.png`:
- Should predict: **Cat**
- Confidence: ~60-90% (varies by model)
- Grad-CAM: Should highlight the cat's face and body

## 💡 Tips

1. **Try Different Images**: Test all 10 classes to see how the model performs
2. **Check Confidence**: Higher confidence = more certain prediction
3. **Analyze Grad-CAM**: See if the model focuses on the right parts
4. **Compare Models**: When refined model is available, use "Compare Both"

## 🔧 Troubleshooting

### Image Won't Upload
- Make sure file is PNG format
- Check file isn't corrupted
- Try a different sample image

### Classification Fails
- Check server is running (http://localhost:5000/api/health)
- Look at terminal for error messages
- Ensure baseline model is loaded

### Low Accuracy
- CIFAR-10 images are 32x32 (very small!)
- Some classes are harder (cat/dog, deer/horse)
- This is expected behavior for the dataset

## 📊 Expected Performance

Based on your model's test results:

**Strong Classes** (>80% accuracy):
- ✈️ Airplane
- 🚗 Automobile  
- 🚢 Ship
- 🚚 Truck

**Moderate Classes** (60-80%):
- 🐦 Bird
- 🐱 Cat
- 🦌 Deer
- 🐕 Dog
- 🐸 Frog
- 🐴 Horse

## 🎯 Next Steps

1. **Test All Images**: Upload each sample to see model performance
2. **Try Your Own Images**: Upload any image with these objects
3. **Train Refined Model**: Run `python main.py` to get the refined model
4. **Compare Results**: Use "Compare Both" to see improvements

---

**Enjoy testing your Explainable AI Classifier!** 🚀✨

Server: http://localhost:5000
