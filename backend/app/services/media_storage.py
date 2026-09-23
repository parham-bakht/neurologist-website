from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
import uuid

from PIL import Image, ImageOps, UnidentifiedImageError


MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000
MAX_IMAGE_EDGE = 3000
MAX_VIDEO_BYTES = 100 * 1024 * 1024
SUPPORTED_FORMATS = {
    "JPEG": ("image/jpeg", ".jpg"),
    "PNG": ("image/png", ".png"),
    "WEBP": ("image/webp", ".webp"),
}


class InvalidImage(ValueError):
    pass


class InvalidVideo(ValueError):
    pass


@dataclass(frozen=True)
class StoredImage:
    storage_key: str
    url: str
    mime_type: str
    width: int
    height: int
    file_size: int


@dataclass(frozen=True)
class StoredVideo:
    storage_key: str
    url: str
    mime_type: str
    file_size: int


class LocalArticleImageStorage:
    """Filesystem-backed storage with an interface that can be replaced by S3/R2/MinIO."""

    def __init__(self, root: Path):
        self.root = root

    def save(self, content: bytes) -> StoredImage:
        if not content:
            raise InvalidImage("The uploaded image is empty")
        if len(content) > MAX_IMAGE_BYTES:
            raise InvalidImage("Images must be 10 MB or smaller")
        try:
            Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
            with Image.open(BytesIO(content)) as probe:
                image_format = probe.format
                if probe.width is None or probe.height is None or probe.width * probe.height > MAX_IMAGE_PIXELS:
                    raise InvalidImage("The uploaded image has too many pixels")
                probe.verify()
            if image_format not in SUPPORTED_FORMATS:
                raise InvalidImage("Use a JPEG, PNG, or WebP image")
            with Image.open(BytesIO(content)) as source:
                image = ImageOps.exif_transpose(source)
                image.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.Resampling.LANCZOS)
                mime_type, extension = SUPPORTED_FORMATS[image_format]
                output = BytesIO()
                if image_format == "JPEG":
                    if image.mode not in ("RGB", "L"):
                        image = image.convert("RGB")
                    image.save(output, format="JPEG", quality=88, optimize=True, progressive=True)
                elif image_format == "PNG":
                    image.save(output, format="PNG", optimize=True)
                else:
                    image.save(output, format="WEBP", quality=88, method=6)
                width, height = image.size
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
            if isinstance(exc, InvalidImage):
                raise
            raise InvalidImage("The uploaded file is not a valid image") from exc

        stored = output.getvalue()
        storage_key = f"articles/{uuid.uuid4().hex}{extension}"
        path = self.root / storage_key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(stored)
        return StoredImage(
            storage_key=storage_key,
            url=f"/uploads/{storage_key}",
            mime_type=mime_type,
            width=width,
            height=height,
            file_size=len(stored),
        )

    def delete(self, storage_key: str) -> None:
        path = (self.root / storage_key).resolve()
        root = self.root.resolve()
        if root not in path.parents:
            raise ValueError("Invalid storage key")
        path.unlink(missing_ok=True)


class LocalArticleVideoStorage:
    """Strict local MP4/WebM storage; a cloud object store can replace this later."""

    def __init__(self, root: Path):
        self.root = root

    def save(self, content: bytes) -> StoredVideo:
        if not content:
            raise InvalidVideo("The uploaded video is empty")
        if len(content) > MAX_VIDEO_BYTES:
            raise InvalidVideo("Videos must be 100 MB or smaller")
        if len(content) < 12:
            raise InvalidVideo("The uploaded file is not a valid video")

        if content[4:8] == b"ftyp":
            mime_type, extension = "video/mp4", ".mp4"
        elif content[:4] == b"\x1a\x45\xdf\xa3":
            mime_type, extension = "video/webm", ".webm"
        else:
            raise InvalidVideo("Use a valid MP4 or WebM video")

        storage_key = f"articles/{uuid.uuid4().hex}{extension}"
        path = self.root / storage_key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return StoredVideo(storage_key=storage_key, url=f"/uploads/{storage_key}", mime_type=mime_type, file_size=len(content))

    def delete(self, storage_key: str) -> None:
        path = (self.root / storage_key).resolve()
        root = self.root.resolve()
        if root not in path.parents:
            raise ValueError("Invalid storage key")
        path.unlink(missing_ok=True)
