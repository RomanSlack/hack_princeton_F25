#!/usr/bin/env python3
"""
Script to add rounded corners to all images in readme_Images directory.
"""

from PIL import Image, ImageDraw
import os
from pathlib import Path

def add_rounded_corners(image_path, radius=30):
    """
    Add rounded corners to an image.

    Args:
        image_path: Path to the input image
        radius: Corner radius in pixels (default: 30)
    """
    # Open the image
    img = Image.open(image_path).convert("RGBA")

    # Create a mask for rounded corners
    mask = Image.new('L', img.size, 0)
    draw = ImageDraw.Draw(mask)

    # Draw rounded rectangle on mask
    draw.rounded_rectangle(
        [(0, 0), img.size],
        radius=radius,
        fill=255
    )

    # Apply the mask
    output = Image.new('RGBA', img.size, (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)

    # Save the image
    output.save(image_path, format='PNG')
    print(f"✓ Processed: {os.path.basename(image_path)}")

def main():
    """Process all images in the readme_Images directory."""
    images_dir = Path("/home/roman/hack_princeton_F25/readme_Images")

    # Supported image formats
    image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp'}

    # Process each image
    for image_file in images_dir.iterdir():
        if image_file.suffix.lower() in image_extensions:
            try:
                add_rounded_corners(str(image_file))
            except Exception as e:
                print(f"✗ Error processing {image_file.name}: {e}")

    print("\nAll images processed!")

if __name__ == "__main__":
    main()
