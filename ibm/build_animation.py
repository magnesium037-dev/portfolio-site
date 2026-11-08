"""Build the original eight-bar Lottie timeline for this design study."""

import json
import math
from pathlib import Path


bars = 8
angles = [-135, 180, 135, 90, -90, -45, 0, 45]
rotations = [-45, 90, 45, 0, 0, 45, 90, -45]
states = [
    [[50, 18 + i * 9, width, 0] for i, width in enumerate([24, 35, 46, 58, 58, 46, 35, 24])],
    [[20 + (20 + i * 8) / 2, 18 + i * 9, 20 + i * 8, 0] for i in range(bars)],
    [[30 if i < 4 else 70, 28 + (i % 4) * 11, 32 - (i % 4) * 6, 0] for i in range(bars)],
    [[50 + math.cos(math.radians(angle)) * 30,
      50 + math.sin(math.radians(angle)) * 30, 21, rotations[i]]
     for i, angle in enumerate(angles)],
    [[28 + (i % 4) * 7 if i < 4 else 72 - (i % 4) * 7,
      24 + (i % 4) * 12, 30, 0] for i in range(bars)],
    [[25 + i * 7, 18 + i * 9, 30, 0] for i in range(bars)],
]

# Hold each authored composition briefly, then ease its eight persistent bars
# into the next one. The webpage only selects a time on this finished timeline.
timeline = [(0, 0)]
for state in range(5):
    timeline += [((state * 100) + 12, state),
                 ((state * 100) + 88, state + 1),
                 ((state + 1) * 100, state + 1)]


def animated(values):
    keys = []
    for time, value in values:
        key = {"t": time, "s": value if isinstance(value, list) else [value]}
        if time != 500:
            key.update({"i": {"x": 0.6, "y": 1}, "o": {"x": 0.4, "y": 0}})
            if len(key["s"]) == 3:
                key.update({"to": [0, 0, 0], "ti": [0, 0, 0]})
        keys.append(key)
    return {"a": 1, "k": keys}


def bar_layer(index):
    values = [(time, states[state][index]) for time, state in timeline]
    position = animated([(time, [round(x * 5, 4), round(y * 5, 4), 0])
                         for time, (x, y, _, _) in values])
    scale = animated([(time, [round(width * 5, 4), 100, 100])
                      for time, (_, _, width, _) in values])
    rotation = animated([(time, angle) for time, (_, _, _, angle) in values])
    return {
        "ddd": 0, "ind": index + 1, "ty": 4, "nm": f"Persistent bar {index + 1}",
        "sr": 1, "ks": {"o": {"a": 0, "k": 100}, "r": rotation,
                         "p": position, "a": {"a": 0, "k": [0, 0, 0]}, "s": scale},
        "ao": 0,
        "shapes": [{"ty": "gr", "it": [
            {"ty": "rc", "d": 1, "s": {"a": 0, "k": [100, 18.5]},
             "p": {"a": 0, "k": [0, 0]}, "r": {"a": 0, "k": 0}, "nm": "Bar"},
            {"ty": "fl", "c": {"a": 0, "k": [215 / 255, 232 / 255, 1, 1]},
             "o": {"a": 0, "k": 100}, "r": 1, "nm": "Pale blue"},
            {"ty": "tr", "p": {"a": 0, "k": [0, 0]}, "a": {"a": 0, "k": [0, 0]},
             "s": {"a": 0, "k": [100, 100]}, "r": {"a": 0, "k": 0},
             "o": {"a": 0, "k": 100}, "sk": {"a": 0, "k": 0}, "sa": {"a": 0, "k": 0}}],
            "nm": f"Bar {index + 1}"}],
        "ip": 0, "op": 501, "st": 0, "bm": 0,
    }


animation = {
    "v": "5.12.1", "fr": 30, "ip": 0, "op": 501, "w": 500, "h": 500,
    "nm": "IBM concept study — eight persistent bars", "ddd": 0,
    "assets": [], "layers": [bar_layer(i) for i in range(bars)], "markers": [],
}
assert len(animation["layers"]) == bars
assert all(len(layer["ks"]["p"]["k"]) == len(timeline) for layer in animation["layers"])
output = Path(__file__).with_name("assets") / "animation" / "ibm-values.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(animation, separators=(",", ":")), encoding="utf-8")
print(output)
