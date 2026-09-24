"""
Phase-Aware Pose Correction Model — Keras dual-output architecture.

Input:  33 landmarks x 3 coords + exercise one-hot = 99 + N
Output: phase (1 sigmoid) + corrected landmarks (99 values)

The correction head receives the phase prediction, learning:
"at phase X of exercise Y, the body should look like Z."

~30K parameters -> ~60KB in float16 TFLite.
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

from .normalization import INPUT_DIM, LANDMARK_FLAT


def build_pose_correction_model(
    input_dim: int = INPUT_DIM,
    landmark_output_dim: int = LANDMARK_FLAT,
    phase_loss_weight: float = 0.3,
) -> keras.Model:
    """Build the dual-output pose correction model.

    Architecture:
        Shared Encoder: Dense(128) -> Dense(64) -> Dense(32)
        Phase Head: Dense(16) -> Dense(1, sigmoid)
        Correction Head: Concat(shared, phase) -> Dense(64) -> Dense(128) -> Dense(99)
    """
    inputs = keras.Input(shape=(input_dim,), name="input")

    # Shared encoder
    x = layers.Dense(128, activation="relu", name="shared_1")(inputs)
    x = layers.Dropout(0.1, name="shared_drop_1")(x)
    x = layers.Dense(64, activation="relu", name="shared_2")(x)
    x = layers.Dropout(0.1, name="shared_drop_2")(x)
    shared = layers.Dense(32, activation="relu", name="shared_3")(x)

    # Phase head
    phase_x = layers.Dense(16, activation="relu", name="phase_dense")(shared)
    phase_output = layers.Dense(1, activation="sigmoid", name="phase")(phase_x)

    # Correction head — phase-informed
    correction_input = layers.Concatenate(name="correction_concat")([shared, phase_output])
    cx = layers.Dense(64, activation="relu", name="correction_1")(correction_input)
    cx = layers.Dropout(0.1, name="correction_drop_1")(cx)
    cx = layers.Dense(128, activation="relu", name="correction_2")(cx)
    cx = layers.Dropout(0.1, name="correction_drop_2")(cx)
    correction_output = layers.Dense(landmark_output_dim, name="correction")(cx)

    model = keras.Model(inputs=inputs, outputs=[phase_output, correction_output])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss={
            "phase": "mse",
            "correction": "mse",
        },
        loss_weights={
            "phase": phase_loss_weight,
            "correction": 1.0,
        },
        metrics={
            "phase": ["mae"],
            "correction": ["mae"],
        },
    )

    return model


def train_model(
    model: keras.Model,
    train_data: dict,
    val_data: dict,
    epochs: int = 100,
    batch_size: int = 64,
    patience: int = 15,
) -> keras.callbacks.History:
    """Train the model with early stopping and learning rate reduction."""
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=patience,
            restore_best_weights=True,
            verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=7,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    history = model.fit(
        x=train_data["inputs"],
        y={
            "phase": train_data["phase_targets"],
            "correction": train_data["landmark_targets"],
        },
        validation_data=(
            val_data["inputs"],
            {
                "phase": val_data["phase_targets"],
                "correction": val_data["landmark_targets"],
            },
        ),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=1,
    )

    return history


def evaluate_model(model: keras.Model, test_data: dict) -> dict:
    """Evaluate model on test set with per-joint error analysis."""
    phase_pred, correction_pred = model.predict(test_data["inputs"], verbose=0)

    phase_mae = float(abs(phase_pred.flatten() - test_data["phase_targets"]).mean())

    correction_errors = abs(correction_pred - test_data["landmark_targets"])
    correction_mae = float(correction_errors.mean())

    # Per-joint error (reshape to 33x3, average over xyz)
    per_joint = correction_errors.reshape(-1, 33, 3).mean(axis=(0, 2))

    # MediaPipe 33 landmark names
    joint_names = [
        "nose", "l_eye_inner", "l_eye", "l_eye_outer",
        "r_eye_inner", "r_eye", "r_eye_outer",
        "l_ear", "r_ear", "l_mouth", "r_mouth",
        "l_shoulder", "r_shoulder", "l_elbow", "r_elbow",
        "l_wrist", "r_wrist", "l_pinky", "r_pinky",
        "l_index", "r_index", "l_thumb", "r_thumb",
        "l_hip", "r_hip", "l_knee", "r_knee",
        "l_ankle", "r_ankle", "l_heel", "r_heel",
        "l_foot_index", "r_foot_index",
    ]

    return {
        "phase_mae": phase_mae,
        "correction_mae": correction_mae,
        "per_joint_mae": {name: float(err) for name, err in zip(joint_names, per_joint)},
    }


def get_model_summary(model: keras.Model) -> str:
    """Get model summary as string."""
    lines = []
    model.summary(print_fn=lambda x: lines.append(x))
    return "\n".join(lines)
