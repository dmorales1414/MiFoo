"""Test barcode scanning with your laptop's webcam (or a photo), then look the
product up through the MiFoo backend.

    python scripts/scan_webcam.py                    # webcam + backend lookup
    python scripts/scan_webcam.py --no-api           # only decode, no backend
    python scripts/scan_webcam.py --image photo.png  # decode a picture instead
    python scripts/scan_webcam.py --camera 1         # use a different camera

Keys in the preview window: Q or Esc = quit.
Tips: good light, hold the barcode flat 15-30 cm away, fill about a quarter of the
frame width or more, and keep it still for a second. Laptop cameras are fixed-focus
and blurry up close, so if it will not read, move the barcode FARTHER away.
"""
import argparse
import sys
import time

import cv2
import httpx

detector = cv2.barcode.BarcodeDetector()


def check_digit_ok(code: str) -> bool:
    """Same GTIN check as the backend. Rejects most misreads."""
    if not code.isdigit() or len(code) not in (8, 12, 13, 14):
        return False
    body, check = [int(c) for c in code[:-1]], int(code[-1])
    total = sum(d * (3 if i % 2 == 0 else 1) for i, d in enumerate(reversed(body)))
    return (10 - total % 10) % 10 == check


def decode(frame):
    """Return (code, corner_points) or (None, None). Tries a few tricks because
    webcam frames are noisy: normal, then grayscale, then half size."""
    attempts = (
        frame,
        cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY),
        cv2.resize(frame, None, fx=0.5, fy=0.5),
    )
    for i, img in enumerate(attempts):
        ok, infos, _types, points = detector.detectAndDecodeWithType(img)
        if not ok:
            continue
        for info, pts in zip(infos, points if points is not None else [None] * len(infos)):
            if info and check_digit_ok(info):
                if pts is not None and i == 2:
                    pts = pts * 2  # undo the half-size scaling for drawing
                return info, pts
    return None, None


def lookup(api: str, code: str):
    try:
        r = httpx.get(f"{api}/products/barcode/{code}", timeout=15)
    except httpx.HTTPError as exc:
        return f"Backend not reachable at {api}: {exc}"
    if r.status_code == 200:
        p = r.json()
        return f"FOUND: {p['itemName']}  |  brand: {p.get('brand')}  |  size: {p.get('quantityText')}"
    if r.status_code == 404:
        return "Not in Open Food Facts -> the app would switch to manual entry."
    return f"Backend answered {r.status_code}: {r.text}"


def run_image(path: str, api: str | None) -> int:
    frame = cv2.imread(path)
    if frame is None:
        print(f"Could not read image: {path}")
        return 1
    code, _ = decode(frame)
    if not code:
        print("No valid barcode found in the image.")
        return 1
    print(f"Barcode: {code}")
    if api:
        print(lookup(api, code))
    return 0


def run_webcam(camera: int, api: str | None) -> int:
    # CAP_DSHOW opens much faster on Windows; other systems ignore the difference.
    backend = cv2.CAP_DSHOW if sys.platform.startswith("win") else cv2.CAP_ANY
    cap = cv2.VideoCapture(camera, backend)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    if not cap.isOpened():
        print(f"Could not open camera {camera}. Close other apps using it, or try --camera 1.")
        return 1

    last_code, streak, last_done_at, banner = None, 0, 0.0, "Show a barcode to the camera..."
    print(banner + "  (press Q to quit)")
    while True:
        ok, frame = cap.read()
        if not ok:
            print("Camera stopped sending frames.")
            break

        code, pts = decode(frame)
        # Require the same code 3 frames in a row so one-off misreads are ignored.
        streak = streak + 1 if code and code == last_code else (1 if code else 0)
        last_code = code

        if code and pts is not None:
            cv2.polylines(frame, [pts.astype("int32").reshape(-1, 1, 2)], True, (0, 255, 0), 3)

        # Do the lookup once per confirmed code (and not again for 5 seconds).
        if streak >= 3 and time.time() - last_done_at > 5:
            last_done_at = time.time()
            print(f"\nBarcode: {code}")
            banner = f"{code}  (looking up...)" if api else code
            cv2.putText(frame, banner, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.imshow("MiFoo barcode test", frame)
            cv2.waitKey(1)
            if api:
                banner = lookup(api, code)
                print(banner)
            else:
                banner = f"Barcode {code}"

        cv2.putText(frame, banner[:70], (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.imshow("MiFoo barcode test", frame)
        if cv2.waitKey(1) & 0xFF in (ord("q"), 27):
            break

    cap.release()
    cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--api", default="http://127.0.0.1:8000", help="backend address")
    ap.add_argument("--no-api", action="store_true", help="only decode, skip the backend lookup")
    ap.add_argument("--image", help="decode this picture instead of using the webcam")
    ap.add_argument("--camera", type=int, default=0, help="camera number (0 = default)")
    args = ap.parse_args()
    api = None if args.no_api else args.api.rstrip("/")
    sys.exit(run_image(args.image, api) if args.image else run_webcam(args.camera, api))
