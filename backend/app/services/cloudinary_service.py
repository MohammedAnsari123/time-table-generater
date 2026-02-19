import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import settings

# --- Configure Cloudinary on module load ---
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True  # Always use HTTPS
)

def upload_image(file_bytes: bytes, public_id: str = None, folder: str = "timetable_assets") -> dict:
    """
    Upload an image (bytes) to Cloudinary.
    
    Args:
        file_bytes:  Raw bytes of the image file.
        public_id:   Optional custom ID for the asset. Auto-generated if None.
        folder:      Cloudinary folder to upload into. Default: 'timetable_assets'.
    
    Returns:
        dict with keys: 'url', 'public_id', 'width', 'height', 'format'

    Example:
        with open("header.jpg", "rb") as f:
            result = upload_image(f.read(), public_id="tpoly_header")
        print(result["url"])  # https://res.cloudinary.com/...
    """
    try:
        upload_options = {
            "folder": folder,
            "resource_type": "image",
        }
        if public_id:
            upload_options["public_id"] = public_id
            upload_options["overwrite"] = True

        result = cloudinary.uploader.upload(file_bytes, **upload_options)

        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
        }
    except Exception as e:
        raise RuntimeError(f"Cloudinary upload failed: {e}")


def delete_image(public_id: str) -> dict:
    """
    Delete an image from Cloudinary by public_id.
    
    Args:
        public_id: The Cloudinary public_id of the asset to delete.
    
    Returns:
        dict with 'result' key ('ok' if successful, 'not found' otherwise).

    Example:
        result = delete_image("timetable_assets/tpoly_header")
        print(result)  # {'result': 'ok'}
    """
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type="image")
        return {"result": result.get("result", "unknown")}
    except Exception as e:
        raise RuntimeError(f"Cloudinary delete failed: {e}")


def get_image_url(public_id: str, width: int = None, height: int = None) -> str:
    """
    Get a direct URL for a Cloudinary image. Optionally apply resize transformations.
    
    Args:
        public_id: The Cloudinary public_id.
        width:     Optional width for resize transformation.
        height:    Optional height for resize transformation.
    
    Returns:
        str: Secure URL for the image.

    Example:
        url = get_image_url("timetable_assets/tpoly_header", width=800)
    """
    transformation = {}
    if width:
        transformation["width"] = width
    if height:
        transformation["height"] = height
    if transformation:
        transformation["crop"] = "fill"

    url_options = {
        "public_id": public_id,
        "secure": True,
    }
    if transformation:
        url_options["transformation"] = [transformation]

    from cloudinary import CloudinaryImage
    return CloudinaryImage(public_id).build_url(**url_options)


def list_assets(folder: str = "timetable_assets") -> list:
    """
    List all images in a Cloudinary folder.
    
    Args:
        folder: Cloudinary folder to list. Default: 'timetable_assets'.
    
    Returns:
        list of dicts, each with 'public_id', 'url', 'format'.
    """
    try:
        result = cloudinary.api.resources(
            type="upload",
            prefix=folder,
            resource_type="image",
            max_results=100,
        )
        return [
            {
                "public_id": asset.get("public_id"),
                "url": asset.get("secure_url"),
                "format": asset.get("format"),
            }
            for asset in result.get("resources", [])
        ]
    except Exception as e:
        raise RuntimeError(f"Cloudinary list failed: {e}")
