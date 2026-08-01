"""Run a classifier against eval/dataset/labeled_emails.jsonl and report
precision/recall/false-negative rate for the importance flag.

False-negative rate matters most here: a missed-important email is the
costly failure mode (the user never sees it), while a false positive just
costs an extra glance.

Usage:
    python runEval.py                                 # both classifiers, side by side, original 19-email set
    python runEval.py --classifier llm
    python runEval.py --dataset labeled_emails_1000.jsonl --classifier llm
"""

import argparse
import json
import sys
from pathlib import Path

from baseline import classify as baseline_classify

sys.path.insert(0, str(Path(__file__).parent.parent / "backend" / "ai-service"))
from batch import run_batch  # noqa: E402
from classify import classify_email as llm_classify  # noqa: E402

DATASET_DIR = Path(__file__).parent / "dataset"

CLASSIFIERS = {
    "baseline": lambda email: baseline_classify(email["subject"], email["body"]),
    "llm": llm_classify,
}


def load_dataset(filename: str) -> list[dict]:
    with (DATASET_DIR / filename).open(encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def evaluate(classifier_name: str, dataset_filename: str) -> None:
    classify_fn = CLASSIFIERS[classifier_name]
    emails = load_dataset(dataset_filename)

    # Concurrent regardless of classifier — negligible overhead for the
    # cheap local baseline, and the difference between "runs in 4 minutes"
    # vs. "runs in an hour" for the real LLM classifier at 1000+ emails.
    predictions = run_batch(classify_fn, emails)

    tp = fp = fn = tn = 0
    missed = []
    for email, predicted in zip(emails, predictions):
        actual = email["important"]
        if predicted and actual:
            tp += 1
        elif predicted and not actual:
            fp += 1
        elif not predicted and actual:
            fn += 1
            missed.append(email["id"])
        else:
            tn += 1

    total = len(emails)
    accuracy = (tp + tn) / total if total else 0.0
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    false_negative_rate = fn / (fn + tp) if (fn + tp) else 0.0

    print(f"classifier={classifier_name} n={total}")
    print(f"accuracy:             {accuracy:.0%}")
    print(f"precision:            {precision:.0%}")
    print(f"recall:               {recall:.0%}")
    print(f"false negative rate:  {false_negative_rate:.0%}  (missed-important-email rate)")
    if missed:
        shown = ", ".join(missed[:20])
        more = f" (+{len(missed) - 20} more)" if len(missed) > 20 else ""
        print(f"missed important emails: {shown}{more}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--classifier", choices=[*CLASSIFIERS.keys(), "all"], default="all")
    parser.add_argument("--dataset", default="labeled_emails.jsonl")
    args = parser.parse_args()

    names = CLASSIFIERS.keys() if args.classifier == "all" else [args.classifier]
    for i, name in enumerate(names):
        if i:
            print()
        evaluate(name, args.dataset)
