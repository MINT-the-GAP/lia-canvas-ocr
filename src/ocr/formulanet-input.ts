// Shared, unchanged FormulaNet image preprocessing for every execution profile.

async function sourceToCanvas(image: unknown): Promise<HTMLCanvasElement> {
    if (typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement) {
        return image;
    }

    if (typeof ImageData !== 'undefined' && image instanceof ImageData) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, image.width);
        canvas.height = Math.max(1, image.height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Could not create the FormulaNet source canvas.');
        context.putImageData(image, 0, 0);
        return canvas;
    }

    let bitmap: ImageBitmap | null = null;
    try {
        if (typeof image === 'string') {
            const response = await fetch(image);
            if (!response.ok) throw new Error('Could not load the FormulaNet image input.');
            bitmap = await createImageBitmap(await response.blob());
        } else if (image instanceof Blob) {
            bitmap = await createImageBitmap(image);
        } else {
            const value = image as any;
            if (value && typeof value.convertToBlob === 'function') {
                bitmap = await createImageBitmap(await value.convertToBlob({ type: 'image/png' }));
            } else if (value && typeof value.toBlob === 'function') {
                const blob = await new Promise<Blob>((resolve, reject) => {
                    value.toBlob(
                        (result: Blob | null) => result
                            ? resolve(result)
                            : reject(new Error('FormulaNet toBlob() returned null.')),
                        'image/png'
                    );
                });
                bitmap = await createImageBitmap(blob);
            }
        }
        if (!bitmap) throw new Error('Unsupported FormulaNet image input.');
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, bitmap.width);
        canvas.height = Math.max(1, bitmap.height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Could not create the FormulaNet bitmap canvas.');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0);
        return canvas;
    } finally {
        try { bitmap?.close(); } catch (_) { }
    }
}

export async function prepareFormulaPlane(image: unknown): Promise<Float32Array> {
    const source = await sourceToCanvas(image);
    const context = source.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not read the FormulaNet source image.');
    const pixels = context.getImageData(0, 0, source.width, source.height);
    const grey = new Uint8Array(source.width * source.height);
    let darkCount = 0;
    let lightCount = 0;

    for (let index = 0; index < grey.length; index++) {
        const offset = index * 4;
        const alpha = pixels.data[offset + 3] / 255;
        const red = pixels.data[offset] * alpha + 255 * (1 - alpha);
        const green = pixels.data[offset + 1] * alpha + 255 * (1 - alpha);
        const blue = pixels.data[offset + 2] * alpha + 255 * (1 - alpha);
        const value = Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
        grey[index] = value;
        if (value < 200) darkCount++;
        else lightCount++;
    }

    // Texo accepts both themes by normalising to black ink on white paper.
    if (darkCount >= lightCount) {
        for (let index = 0; index < grey.length; index++) grey[index] = 255 - grey[index];
    }

    let minX = source.width;
    let minY = source.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < source.height; y++) {
        for (let x = 0; x < source.width; x++) {
            if (grey[y * source.width + x] >= 200) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    }
    if (maxX < minX || maxY < minY) throw new Error('FormulaNet received a blank line.');

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const cropped = document.createElement('canvas');
    cropped.width = cropWidth;
    cropped.height = cropHeight;
    const croppedContext = cropped.getContext('2d', { willReadFrequently: true });
    if (!croppedContext) throw new Error('Could not create the FormulaNet crop.');
    const cropPixels = croppedContext.createImageData(cropWidth, cropHeight);
    for (let y = 0; y < cropHeight; y++) {
        for (let x = 0; x < cropWidth; x++) {
            const value = grey[(minY + y) * source.width + minX + x];
            const offset = (y * cropWidth + x) * 4;
            cropPixels.data[offset] = value;
            cropPixels.data[offset + 1] = value;
            cropPixels.data[offset + 2] = value;
            cropPixels.data[offset + 3] = 255;
        }
    }
    croppedContext.putImageData(cropPixels, 0, 0);

    const targetSize = 384;
    const scale = Math.min(targetSize / cropWidth, targetSize / cropHeight);
    const drawWidth = Math.max(1, Math.round(cropWidth * scale));
    const drawHeight = Math.max(1, Math.round(cropHeight * scale));
    const prepared = document.createElement('canvas');
    prepared.width = targetSize;
    prepared.height = targetSize;
    const preparedContext = prepared.getContext('2d', { willReadFrequently: true });
    if (!preparedContext) throw new Error('Could not create the FormulaNet input.');
    preparedContext.fillStyle = '#000';
    preparedContext.fillRect(0, 0, targetSize, targetSize);
    preparedContext.imageSmoothingEnabled = true;
    preparedContext.drawImage(
        cropped,
        Math.floor((targetSize - drawWidth) / 2),
        Math.floor((targetSize - drawHeight) / 2),
        drawWidth,
        drawHeight
    );

    const preparedPixels = preparedContext.getImageData(0, 0, targetSize, targetSize);
    const values = new Float32Array(targetSize * targetSize);
    for (let index = 0; index < values.length; index++) {
        const offset = index * 4;
        const value = (
            preparedPixels.data[offset] * 0.299 +
            preparedPixels.data[offset + 1] * 0.587 +
            preparedPixels.data[offset + 2] * 0.114
        ) / 255;
        values[index] = (value - 0.7931) / 0.1738;
    }

    return values;
}
