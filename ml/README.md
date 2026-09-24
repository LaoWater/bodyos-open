# Movement research

Python source and notebooks for extracting, normalizing and labeling pose landmarks, training a phase/correction model, and exporting TensorFlow Lite. No trained custom model is supplied.

Use a separate virtual environment for this folder and install `requirements.txt`. Start Jupyter from `ml/notebooks` and follow notebooks 01–05 in order with your own consented recordings. Read `docs/DATA_SPECIFICATION.md` and `docs/ML_PIPELINE_OVERVIEW.md` for the data and model contracts. The export notebook copies a trained model to `apps/mobile/assets/models`; the runtime correction hook still needs integration.

`research/` holds comparative experiments and historical findings, not release benchmarks. Historical notes may name the earlier GymCam layout. Public snapshots omit private raw recordings, extracted datasets, generated results and notebook outputs. Reproduce them with data you have permission to use.
