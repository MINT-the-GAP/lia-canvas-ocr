"""Prepare local FormulaNet exports without training, publication or inference.

Install requirements-ocr-benchmark.txt in a virtual environment first.
Artifacts default to TEMP/lia-ocr-priority2-models, outside the repository.
Existing model files are never overwritten; use a fresh --output directory to
retry conversion. --derive-existing only adds new mixed profiles and updates
the existing manifest without changing existing model files. Serve it with remotePathTemplate '{model}/{revision}/'.
All variants retain float32 public I/O and unsuffixed filenames: select dtype
'fp32' in Transformers.js, and report the weights precision from manifest.json.
ONNX checks and CPU session loading do not establish browser compatibility.
"""
from __future__ import annotations
import argparse
import copy
from collections import Counter
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform
import shutil
import tempfile
import time
import traceback
import urllib.request

MODEL = "alephpi/FormulaNet"
REVISION = "63e04c86fc96c2324811114351eeea8118bf6b28"
WEIGHTS = ("encoder_model.onnx", "decoder_model_merged.onnx")
CONFIGS = ("config.json", "tokenizer.json", "tokenizer_config.json",
           "generation_config.json", "special_tokens_map.json")
EXPECTED_BYTES = {"encoder_model.onnx": 54168533, "decoder_model_merged.onnx": 25946296}
EXPECTED_SHA256 = {
    "encoder_model.onnx": "95cccef463e5ed3623282f1541c0011a00b8a5d0828ea2cd57d6953ad4310b5b",
    "decoder_model_merged.onnx": "10be29b751f6de5f9900c3658551020dc865257eb2c3034bc4c1e016e4d0e35d",
}
PACKAGES = ("onnx", "onnxruntime", "onnxconverter-common", "numpy", "protobuf")


def describe(path, root):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return {"path": path.relative_to(root).as_posix(), "bytes": path.stat().st_size,
            "sha256": digest.hexdigest()}


def download(name, destination):
    url = f"https://huggingface.co/{MODEL}/resolve/{REVISION}/{name}"
    print(f"Download {name}", flush=True)
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "lia-ocr-local-precision/1"})
    with urllib.request.urlopen(request, timeout=120) as response, destination.open("xb") as output:
        shutil.copyfileobj(response, output, length=1024 * 1024)
    expected = EXPECTED_BYTES.get(destination.name)
    if expected is not None and destination.stat().st_size != expected:
        raise ValueError(f"Unexpected size for {name}: {destination.stat().st_size} != {expected}")
    expected_hash = EXPECTED_SHA256.get(destination.name)
    if expected_hash and describe(destination, destination.parent)["sha256"] != expected_hash:
        raise ValueError(f"Published LFS checksum mismatch for {name}")
    return {"source_url": url, "upstream_sha256": expected_hash}


def graph_report(model):
    import onnx
    operators, types = Counter(), Counter()
    def visit(graph):
        for tensor in graph.initializer:
            types[onnx.TensorProto.DataType.Name(tensor.data_type)] += 1
        for node in graph.node:
            operators[f"{node.domain or 'ai.onnx'}::{node.op_type}"] += 1
            for attribute in node.attribute:
                if attribute.type == onnx.AttributeProto.GRAPH:
                    visit(attribute.g)
                elif attribute.type == onnx.AttributeProto.GRAPHS:
                    for child in attribute.graphs:
                        visit(child)
    visit(model.graph)
    def io(values):
        return [{"name": value.name,
                 "type": onnx.TensorProto.DataType.Name(value.type.tensor_type.elem_type),
                 "shape": [dimension.dim_param or dimension.dim_value
                           for dimension in value.type.tensor_type.shape.dim]}
                for value in values]
    return {"ir_version": model.ir_version,
            "opsets": {item.domain or "ai.onnx": item.version for item in model.opset_import},
            "inputs": io(model.graph.input), "outputs": io(model.graph.output),
            "operators_recursive": dict(sorted(operators.items())),
            "initializer_types_recursive": dict(sorted(types.items()))}


def validate(path, expected_io, check_session):
    import onnx
    model = onnx.load(str(path))
    onnx.checker.check_model(model, full_check=True)
    report = graph_report(model)
    report["onnx_checker"] = "passed"
    if expected_io is not None:
        for direction in ("inputs", "outputs"):
            if report[direction] != expected_io[direction]:
                raise ValueError(f"Public {direction} changed for {path.name}")
        report["public_io_preserved"] = True
    report["browser_validation"] = "not_run"
    if check_session:
        import onnxruntime as ort
        options = ort.SessionOptions()
        options.intra_op_num_threads = 1
        options.inter_op_num_threads = 1
        options.log_severity_level = 3
        try:
            session = ort.InferenceSession(str(path), sess_options=options,
                                           providers=["CPUExecutionProvider"])
            report["python_cpu_session"] = {"status": "loaded", "providers": session.get_providers()}
            del session
        except Exception as error:
            # A CPU kernel failure does not prove that a GPU export is invalid.
            report["python_cpu_session"] = {"status": "failed", "error": str(error)}
    return report


def derive_profiles(root, manifest, save):
    """Compose checked components, retaining all original (even failed) exports."""
    recipes = {
        "fp16-encoder": {"encoder_model.onnx": "fp16", "decoder_model_merged.onnx": "fp32"},
        "q8-decoder": {"encoder_model.onnx": "fp32", "decoder_model_merged.onnx": "q8"},
    }
    for profile in recipes:
        if (root / profile).exists() or profile in manifest["variants"]:
            raise ValueError(f"Refusing to overwrite derived profile: {profile}")
    for name, expected in EXPECTED_SHA256.items():
        original = root / "fp32" / REVISION / "onnx" / name
        if describe(original, root)["sha256"] != expected:
            raise ValueError(f"Pinned FP32 source checksum mismatch: {name}")
    for profile, sources in recipes.items():
        if not all(manifest["variants"].get(source, {}).get("validation", {})
                   .get(name, {}).get("onnx_checker") == "passed"
                   for name, source in sources.items()):
            continue
        base = root / profile / REVISION
        entry = {"status": "preparing", "weights_precision": {
                    "encoder_model": "fp16" if profile == "fp16-encoder" else "fp32",
                    "decoder_model_merged": "dynamic-q8-matmul" if profile == "q8-decoder" else "fp32"},
                 "public_float_io": "float32", "derived_from": sources,
                 "files": [], "validation": {}}
        for name, source in sources.items():
            origin = root / source / REVISION / "onnx" / name
            metadata = describe(origin, root)
            recorded = next(item for item in manifest["variants"][source]["files"]
                            if item["path"] == metadata["path"])
            if metadata["sha256"] != recorded["sha256"]:
                raise ValueError(f"Existing converted file checksum mismatch: {origin}")
        (base / "onnx").mkdir(parents=True)
        for name in CONFIGS:
            shutil.copyfile(root / "fp32" / REVISION / name, base / name)
            entry["files"].append(describe(base / name, root))
        for name, source in sources.items():
            destination = base / "onnx" / name
            shutil.copyfile(root / source / REVISION / "onnx" / name, destination)
            entry["files"].append(describe(destination, root))
            entry["validation"][name] = copy.deepcopy(manifest["variants"][source]["validation"][name])
        entry["model_bytes"] = sum(item["bytes"] for item in entry["files"]
                                   if item["path"].endswith(".onnx"))
        entry["status"] = "checked"
        manifest["variants"][profile] = entry
        save()
        print(f"{profile}: checked components, {entry['model_bytes']} bytes; no inference", flush=True)


def derive_floorpool_profiles(root, manifest, save, check_session):
    """Change only a proven redundant ceil flag, retaining every source export."""
    import onnx
    expected = {"ceil_mode": 1, "dilations": [1, 1], "kernel_shape": [2, 2],
                "pads": [0, 0, 0, 0], "strides": [1, 1]}
    sources = ("fp32", "fp16-encoder", "q8-decoder")
    for source in sources:
        profile = source + "-floorpool"
        if (root / profile).exists() or profile in manifest["variants"]:
            raise ValueError(f"Refusing to overwrite floorpool profile: {profile}")
        if manifest["variants"].get(source, {}).get("status") != "checked":
            raise ValueError(f"Source profile is not checked: {source}")
    for name, checksum in EXPECTED_SHA256.items():
        if describe(root / "fp32" / REVISION / "onnx" / name, root)["sha256"] != checksum:
            raise ValueError(f"Pinned FP32 source checksum mismatch: {name}")
    for source in sources:
        profile = source + "-floorpool"
        source_entry = manifest["variants"][source]
        base = root / profile / REVISION
        source_base = root / source / REVISION
        for item in source_entry["files"]:
            if describe(root / item["path"], root)["sha256"] != item["sha256"]:
                raise ValueError(f"Source profile checksum mismatch: {item['path']}")
        model = onnx.load(str(source_base / "onnx" / "encoder_model.onnx"))
        original_serialized = model.SerializeToString()
        pools = [node for node in model.graph.node if node.op_type == "MaxPool"]
        if len(pools) != 1:
            raise ValueError(f"Expected exactly one top-level MaxPool, found {len(pools)}")
        node = pools[0]
        attrs = {attr.name: onnx.helper.get_attribute_value(attr) for attr in node.attribute}
        if (node.name != "/stem/pool/MaxPool" or node.domain not in ("", "ai.onnx") or
                list(node.input) != ["/stem/Pad_output_0"] or
                list(node.output) != ["/stem/pool/MaxPool_output_0"] or attrs != expected):
            raise ValueError(f"MaxPool equivalence guard failed: {node.name}: {attrs}")
        ceil_attr = next(attr for attr in node.attribute if attr.name == "ceil_mode")
        ceil_attr.i = 0
        modified_serialized = model.SerializeToString()
        ceil_attr.i = 1
        if model.SerializeToString() != original_serialized:
            raise ValueError("Unexpected graph change beyond the guarded ceil_mode attribute")
        (base / "onnx").mkdir(parents=True)
        for name in CONFIGS:
            shutil.copyfile(source_base / name, base / name)
        encoder = base / "onnx" / "encoder_model.onnx"
        with encoder.open("xb") as output:
            output.write(modified_serialized)
        shutil.copyfile(source_base / "onnx" / "decoder_model_merged.onnx",
                        base / "onnx" / "decoder_model_merged.onnx")
        entry = {"status": "preparing", "weights_precision": copy.deepcopy(source_entry["weights_precision"]),
                 "derived_from": source, "public_float_io": "float32", "files": [],
                 "validation": {}, "graph_transformation": {
                     "node": node.name, "attribute": "ceil_mode", "before": 1, "after": 0,
                     "guard": expected, "other_graph_bytes_preserved": True,
                     "proof": "For every valid integer spatial size N: floor((N-2)/1+1) = ceil((N-2)/1+1) = N-1. "
                              "Stride 1, dilation 1, kernel 2, no pool padding give the same complete windows; "
                              "no added padding or fixed-input-shape assumption is needed.",
                     "spec": "https://onnx.ai/onnx/operators/onnx__MaxPool.html#maxpool-12"}}
        manifest["variants"][profile] = entry
        try:
            for name in WEIGHTS:
                path = base / "onnx" / name
                entry["validation"][name] = validate(path, source_entry["validation"][name], check_session)
            entry["status"] = "checked"
        except Exception as error:
            entry["status"] = "failed"
            entry["error"] = str(error)
            manifest["failures"].append({"variant": profile, "error": str(error)})
        entry["files"] = [describe(base / name, root) for name in CONFIGS]
        entry["files"].extend(describe(base / "onnx" / name, root) for name in WEIGHTS)
        entry["model_bytes"] = sum(item["bytes"] for item in entry["files"]
                                   if item["path"].endswith(".onnx"))
        save()
        print(f"{profile}: {entry['status']}, {entry['model_bytes']} bytes; no inference", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path,
                        default=Path(tempfile.gettempdir()) / "lia-ocr-priority2-models")
    parser.add_argument("--skip-session-load", action="store_true")
    parser.add_argument("--derive-existing", action="store_true",
                        help="Add new mixed profiles to an existing checked run; do not reconvert or overwrite models.")
    parser.add_argument("--derive-floorpool", action="store_true",
                        help="Add guarded, mathematically equivalent stride-one MaxPool profiles to an existing run.")
    args = parser.parse_args()
    if args.derive_existing and args.derive_floorpool:
        parser.error("Choose one derivation mode per invocation.")
    root = args.output.resolve()
    repo = Path(__file__).resolve().parents[1]
    if root == repo or root.is_relative_to(repo):
        parser.error("Model artifacts must be outside the repository.")
    if args.derive_existing or args.derive_floorpool:
        manifest_path = root / "manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest.get("model") != MODEL or manifest.get("revision") != REVISION:
            parser.error("Existing manifest uses a different source model.")
        def save_derived():
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        if args.derive_floorpool:
            derive_floorpool_profiles(root, manifest, save_derived, not args.skip_session_load)
            return int(any(entry.get("status") == "failed"
                           for name, entry in manifest["variants"].items()
                           if name.endswith("-floorpool")))
        else:
            derive_profiles(root, manifest, save_derived)
        return 0
    if root.exists() and any(root.iterdir()):
        parser.error(f"Refusing to overwrite existing run: {root}")
    root.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema": 1, "model": MODEL, "revision": REVISION,
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "python": platform.python_version(),
        "export_tools": {name: importlib.metadata.version(name) for name in PACKAGES},
        "browser_target": {"transformers_js": "3.8.1",
                           "onnxruntime_web": "1.22.0-dev.20250409-89f8206ba4"},
        "runtime_dtype_selector": "fp32", "training": False, "inference": "not_run",
        "variants": {}, "failures": [],
    }
    def save():
        (root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    save()
    try:
        fp32 = root / "fp32" / REVISION
        files = []
        for name in CONFIGS + tuple(f"onnx/{name}" for name in WEIGHTS):
            path = fp32 / name
            metadata = download(name, path)
            files.append({**describe(path, root), **metadata})
        checks = {name: validate(fp32 / "onnx" / name, None, not args.skip_session_load)
                  for name in WEIGHTS}
        manifest["variants"]["fp32"] = {
            "status": "checked", "weights_precision": "fp32", "files": files,
            "model_bytes": sum(EXPECTED_BYTES.values()), "validation": checks}
        save()
        for variant in ("fp16", "q8"):
            base = root / variant / REVISION
            (base / "onnx").mkdir(parents=True)
            for name in CONFIGS:
                shutil.copyfile(fp32 / name, base / name)
            entry = {"status": "preparing", "weights_precision": variant,
                     "public_float_io": "float32", "files": [], "validation": {}}
            entry["conversion"] = (
                {"method": "convert_float_to_float16", "keep_io_types": True}
                if variant == "fp16" else
                {"method": "quantize_dynamic", "weight_type": "QInt8",
                 "op_types_to_quantize": ["MatMul", "Gemm"], "per_channel": False,
                 "reduce_range": False, "extra_options": {"EnableSubgraph": True}})
            manifest["variants"][variant] = entry
            save()
            for name in WEIGHTS:
                started = time.monotonic()
                destination = base / "onnx" / name
                try:
                    print(f"Convert {variant}: {name}", flush=True)
                    import onnx
                    if variant == "fp16":
                        from onnxconverter_common import float16
                        converted = float16.convert_float_to_float16(
                            onnx.load(str(fp32 / "onnx" / name)), keep_io_types=True)
                        onnx.save(converted, str(destination))
                        del converted
                    else:
                        from onnxruntime.quantization import QuantType, quantize_dynamic
                        # Keep convolution weights unchanged: ConvInteger is not
                        # universally implemented in browser ORT. This is dynamic
                        # MatMul/Gemm Q8, not whole-model integer quantization.
                        quantize_dynamic(str(fp32 / "onnx" / name), str(destination),
                                         weight_type=QuantType.QInt8,
                                         op_types_to_quantize=["MatMul", "Gemm"],
                                         per_channel=False, reduce_range=False,
                                         extra_options={"EnableSubgraph": True})
                    entry["validation"][name] = validate(
                        destination, checks[name], not args.skip_session_load)
                    entry["validation"][name]["elapsed_seconds"] = round(time.monotonic() - started, 3)
                except Exception as error:
                    entry["validation"][name] = {
                        "status": "failed", "error": str(error), "traceback": traceback.format_exc()}
                    manifest["failures"].append({"variant": variant, "file": name, "error": str(error)})
                    print(f"FAILED {variant}/{name}: {error}", flush=True)
                finally:
                    if destination.exists():
                        entry["files"].append(describe(destination, root))
                    save()
            entry["files"].extend(describe(base / name, root) for name in CONFIGS)
            entry["status"] = ("checked" if all(
                item.get("onnx_checker") == "passed" for item in entry["validation"].values())
                else "failed")
            entry["model_bytes"] = sum(item["bytes"] for item in entry["files"]
                                       if item["path"].endswith(".onnx"))
            save()
        derive_profiles(root, manifest, save)
    except Exception as error:
        manifest["failures"].append({"stage": "preparation", "error": str(error),
                                     "traceback": traceback.format_exc()})
        save()
        print(f"Preparation failed: {error}", flush=True)
        return 1
    print(f"Manifest: {root / 'manifest.json'}", flush=True)
    for name, entry in manifest["variants"].items():
        print(f"{name}: {entry['status']}; browser inference not run", flush=True)
    return 1 if manifest["failures"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
