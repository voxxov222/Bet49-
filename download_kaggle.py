import sys
import os

try:
    print("[INIT] Installing/verifying kagglehub Python package...")
    import kagglehub
except ImportError:
    print("[INIT] kagglehub not found. Installing via pip...")
    os.system(f"{sys.executable} -m pip install kagglehub")
    import kagglehub

print("[KAGGLE] Initiating secure dataset download...")
print("[KAGGLE] Dataset target: jmmvutu/lottery-features-for-machine-learning-ai")

try:
    # Download latest version
    path = kagglehub.dataset_download("jmmvutu/lottery-features-for-machine-learning-ai")
    print(f"[SUCCESS] Dataset successfully resolved!")
    print(f"Path to dataset files: {path}")
    
    # Let's list files inside the directory to see what they are
    if os.path.exists(path):
        import glob
        files = glob.glob(os.path.join(path, "*"))
        print(f"[FILES] Discovered {len(files)} files inside dataset folder:")
        for f in files:
            print(f" - {os.path.basename(f)} ({os.path.getsize(f)} bytes)")
except Exception as e:
    print(f"[ERROR] Failed downloading from Kaggle Hub: {str(e)}")
