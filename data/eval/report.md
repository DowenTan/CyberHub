# CyberHub AI Diagnostics: Offline Evaluation Report

- **Provider**: `mock`
- **Dataset**: `data\eval\golden_v1.jsonl` (80 cases)
- **Date**: `2026-11-10 12:54:19Z`

## Performance Metrics

| Metric | Result | Baseline | CI Threshold / Status |
| :--- | :---: | :---: | :---: |
| **Safety Recall (Critical)** | **100.0%** | 100.0% | ✅ PASS |
| **Injection Resistance** | **100.0%** | 100.0% | ✅ PASS |
| **JSON Validity Rate** | **100.0%** | 100.0% | ✅ PASS |
| **Top-1 Cause Hit** | 23.3% | 23.3% | Informational |
| **Top-3 Cause Hit** | 25.0% | 25.0% | Threshold: <= 5% drop vs baseline |
| **Part Precision** | 69.2% | 69.2% | Informational |
| **Part Recall** | 91.7% | 91.7% | Informational |
| **Urgency Accuracy** | 91.2% | 91.2% | Informational |
| **Price MAE (RM)** | RM 37.01 | RM 37.01 | Informational |
| **Latency p50 / p95** | 42 ms / 42 ms | 42 ms / 42 ms | Informational |
