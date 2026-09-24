# Research Quickstart Guide

Get up and running with ML research in 10 minutes.

## 1. Environment Setup

```bash
cd /path/to/GymCam/ml

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r research/requirements.txt
```

**Note:** All scripts use the **MediaPipe Tasks API** (2024+). Models are
downloaded automatically on first run (~4-10MB each).

## 2. Test Data

Test videos live in `research/data/portrait/`:

```
research/data/portrait/
  pushup.mov
```

We're testing **portrait orientation only** for now.

### Recording Guidelines

**Portrait videos (9:16 aspect):**
- Phone held vertically
- Full body visible from head to feet
- Good for: Squat, Lunge, Push-up, Standing exercises
- Record in 1080x1920 or similar

**Tips:**
- Wear form-fitting athletic clothes
- Good lighting, minimal shadows
- Clean background
- 10-30 seconds per video
- Include some intentional errors (optional, for training data)

## 3. Run First Analysis

### Orientation Analysis
Test how well MediaPipe detects poses:

```bash
cd research/01_orientation_analysis
python analyze_orientation_accuracy.py --video_dir ../data/portrait
```

**Output:**
- Console summary of detection rates
- `results/orientation_comparison.png` - Visual comparison
- `results/analysis_report.json` - Detailed metrics

### Model Variant Comparison
Compare Lite/Full/Heavy PoseLandmarker models:

```bash
cd ../02_mediapipe_tuning
python test_model_complexity.py --video_dir ../data/portrait
```

### Threshold Tuning
Find optimal confidence thresholds for a specific video:

```bash
python test_confidence_thresholds.py --video ../data/portrait/pushup.mov
```

## 4. Interactive Research

For exploratory analysis, use the Jupyter notebooks:

```bash
cd research
jupyter notebook
```

Open `notebooks/orientation_deep_dive.ipynb` and follow the cells.

## 5. Key Metrics to Track

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Detection Rate | >95% | 85-95% | <85% |
| Major Joint Visibility | >0.8 | 0.6-0.8 | <0.6 |
| Jitter Score | <0.01 | 0.01-0.03 | >0.03 |
| Inference Time | <30ms | 30-100ms | >100ms |

## 6. Experiment Tracking

For each experiment:

1. Document in a markdown file: `research/experiments/YYYYMMDD_experiment_name.md`
2. Include:
   - Hypothesis
   - Methodology
   - Results (with visualizations)
   - Conclusions
   - Next steps

## 7. Common Issues

### "No videos found"
- Check file paths are correct
- Scripts search for both `.mp4` and `.mov` files
- Check read permissions

### "Cannot open video"
- Install ffmpeg: `brew install ffmpeg` (Mac) or `apt install ffmpeg` (Linux)
- Re-encode problematic videos: `ffmpeg -i input.mov -c:v libx264 output.mp4`

### Low detection rates
- Improve lighting
- Ensure full body is visible
- Try lower confidence thresholds
- Check if subject is wearing contrasting colors

### Out of memory
- Reduce video resolution before processing
- Process fewer frames at a time
- Use `--model lite` for initial tests
