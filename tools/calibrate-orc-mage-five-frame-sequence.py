from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[1]
base_path = ROOT / "tools" / "calibrate-undead-warrior-five-frame-sequence.py"
spec = spec_from_file_location("five_frame_sequence_base", base_path)
base = module_from_spec(spec)
spec.loader.exec_module(base)

base.OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "orc-mage-five-frame-v3"
base.SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-5c31579b-043e-42a8-8c7c-e68cdfa127e1.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-4a639dbe-3d56-497d-bcab-0a2523f52cf9.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-b3c09b1a-794b-4546-80e1-53b4a4402858.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-4e6c59f1-d631-4a1a-8bf6-1567b820e136.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-e8a5d8d7-7bbe-4c6d-b0f4-079a50449926.png"),
]
base.CANVAS = (1510, 1450)
base.TARGET_CENTER_X = 750
base.TARGET_FOOT_Y = 1350
base.SAFETY_MARGIN = 55
base.SCALE_OVERRIDES = {
    1: 0.991525,
    2: 1.000855,
    3: 1.040000,
    4: 0.989848,
    5: 1.005155,
}


def main():
    base.main()
    report_path = base.OUTPUT / "analysis.json"
    report = json.loads(report_path.read_text(encoding="utf-8"))
    report.update({
        "method": "Shoe baseline + torso core center; raised arm, spellbook, cape, flames, and low-alpha magic trails excluded from body-scale judgment",
        "scaling_decision": "Visual-volume correction keeps frames 1, 2, 4, and 5 near 1170 px while reducing frame 3 from 1.069470 to 1.04 because its thicker torso, hood, and shoulder redraw looked oversized at equal measured height. Shoes and torso centers are realigned after scaling.",
        "local_redraw_difference": "Minor AI redraw differences remain in face, hood, shoulder spikes, torso, and leg proportions. They were retained rather than forcing non-uniform distortion.",
        "container_check": "Preview stage uses overflow:visible and object-fit:contain; the spellbook, cape, flames, and low-alpha magic trails remain visible.",
        "playback": {"frame_duration_ms": 312.5, "loop_duration_ms": 2500, "order": [1, 2, 3, 4, 5, 4, 3, 2]},
    })
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
