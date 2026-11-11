#!/usr/bin/env python3
"""Собирает src/ в один файл места ShadowWorld.rbxlx (без Rojo).

Запуск: python3 tools/build_place.py
Результат: build/ShadowWorld.rbxlx — открывается в Roblox Studio двойным кликом.
"""
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "build" / "ShadowWorld.rbxlx"

# (служба, путь внутри службы, папка с исходниками)
MAPPING = [
    ("ReplicatedStorage", ["Shared"], ROOT / "src" / "shared"),
    ("ServerScriptService", ["Server"], ROOT / "src" / "server"),
    ("StarterPlayer", ["StarterPlayerScripts", "Client"], ROOT / "src" / "client"),
]

_ref = 0


def ref():
    global _ref
    _ref += 1
    return f"RBX{_ref:08X}"


def item(cls, name, children="", source=None):
    props = f'<string name="Name">{escape(name)}</string>'
    if source is not None:
        if "]]>" in source:
            raise ValueError(f"{name}: исходник содержит ]]>")
        props += f'<ProtectedString name="Source"><![CDATA[{source}]]></ProtectedString>'
    return f'<Item class="{cls}" referent="{ref()}"><Properties>{props}</Properties>{children}</Item>\n'


def script_item(path: Path):
    stem = path.name[: -len(".luau")]
    if stem.endswith(".server"):
        return item("Script", stem[: -len(".server")], source=path.read_text("utf-8"))
    if stem.endswith(".client"):
        return item("LocalScript", stem[: -len(".client")], source=path.read_text("utf-8"))
    return item("ModuleScript", stem, source=path.read_text("utf-8"))


def folder_tree(path_names, src_dir):
    inner = "".join(script_item(p) for p in sorted(src_dir.glob("*.luau")))
    # Последний элемент пути — папка (Folder), промежуточные — StarterPlayerScripts и т.п.
    *containers, last = path_names
    node = item("Folder", last, inner)
    for name in reversed(containers):
        node = item(name, name, node)  # класс совпадает с именем (StarterPlayerScripts)
    return node


def main():
    body = "".join(item(service, service, folder_tree(path, src)) for service, path, src in MAPPING)
    xml = (
        '<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">\n'
        f"{body}</roblox>\n"
    )
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(xml, "utf-8")
    print(f"Собрано: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
