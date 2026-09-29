from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[1]
base_path = ROOT / "tools" / "calibrate-undead-warrior-five-frame-sequence.py"
spec = spec_from_file_location("undead_sequence_base", base_path)
base = module_from_spec(spec)
spec.loader.exec_module(base)

base.OUTPUT = ROOT / "assets" / "character-portraits" / "calibration-tests" / "undead-assassin-five-frame"
base.SOURCES = [
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-bd916681-3284-45b9-a794-d10b1176936d.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-0af2dc68-c31f-4906-821d-b23546c259ad.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-f388d3b8-51e8-4f1a-9741-f7a2a7b0dbd6.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-e868ba1c-c55e-4ce6-970f-ca65f703b933.png"),
    Path(r"C:\Users\User\AppData\Local\Temp\codex-clipboard-89a5c61b-eca8-41e4-9bc1-3dbaab61cabd.png"),
]
base.CANVAS = (1700, 1500)
base.TARGET_CENTER_X = 850
base.TARGET_FOOT_Y = 1400
base.SAFETY_MARGIN = 55


def main():
    base.main()
    report_path = base.OUTPUT / "analysis.json"
    report = json.loads(report_path.read_text(encoding="utf-8"))
    report.update({
        "method": "Shoe baseline + torso core center; dual blades, extended arms, flowing hair, and cape excluded from body-scale judgment",
        "scaling_decision": "No frame was scaled. The visible height changes are caused by the crouching pose and hair motion rather than a reliable whole-character size change.",
        "local_redraw_difference": "Minor AI redraw differences remain in face, chest, shoulder armor, leg anatomy, and hair volume. They were retained rather than forcing non-uniform distortion.",
        "container_check": "Preview stage uses overflow:visible and object-fit:contain; dual blades, hair, limbs, and cape remain visible.",
        "playback": {"frame_duration_ms": 333.333333, "loop_duration_ms": 2000, "order": [1, 5, 2, 3, 2, 5], "excluded_frames": [4]},
    })
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
