# Android YAMNet asset gate

The Android LIA listener is implemented against Google's YAMNet LiteRT/TFLite audio-event classifier.

Production activation requires this exact asset at build time:

- path: `yamnet.tflite`
- upstream model: `google/yamnet`, LiteRT variation `classification-tflite`, version 1
- expected size: 4,126,810 bytes
- expected SHA-256: `10c95ea3eb9a7bb4cb8bddf6feb023250381008177ac162ce169694d05c317de`
- license: Apache-2.0

Until that asset is present and checksum-verified, `isSoundAnalysisAvailable()` returns false and Android microphone access must remain blocked by the app configuration.
