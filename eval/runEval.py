"""Run a classifier against eval/dataset/labeled_emails.jsonl and report
precision/recall/false-negative rate for the importance flag.

False-negative rate matters most here: a missed-important email is the
costly failure mode (the user never sees it), while a false positive just
costs an extra glance.

Usage:
    python runEval.py                     # both classifiers, side by side
    python runEval.py --classifier baseline
    python runEval.py --classifier llm
"""

import argparse
import json
import sys
from pathlib import Path

from baseline import classify as baseline_classify

sys.path.insert(0, str(Path(__file__).parent.parent / "backend" / "ai-service"))
from classify import classify_email as llm_classify  # noqa: E402

DATASET_PATH = Path(__file__).parent / "dataset" / "labeled_emails.jsonl"

CLASSIFIERS = {
    "baseline": lambda email: baseline_classify(email["subject"], email["body"]),
    "llm": llm_classify,
}


def load_dataset() -> list[dict]:
    with DATASET_PATH.open(encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def evaluate(classifier_name: str) -> None:
    classify_fn = CLASSIFIERS[classifier_name]
    emails = load_dataset()

    tp = fp = fn = tn = 0
    missed = []
    for email in emails:
        predicted = classify_fn(email)
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
        print(f"missed important emails: {', '.join(missed)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--classifier", choices=[*CLASSIFIERS.keys(), "all"], default="all")
    args = parser.parse_args()

    names = CLASSIFIERS.keys() if args.classifier == "all" else [args.classifier]
    for i, name in enumerate(names):
        if i:
            print()
        evaluate(name)
