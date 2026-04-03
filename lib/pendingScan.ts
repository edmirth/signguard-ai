// Module-level store to pass image data from scan screen to analyze screen
// Avoids URL param size limits for large base64 images

let _base64: string | null = null;
let _mimeType: string = 'image/jpeg';

export const setPendingScan = (base64: string, mimeType: string = 'image/jpeg') => {
  _base64 = base64;
  _mimeType = mimeType;
};

export const getPendingScan = () => ({ base64: _base64, mimeType: _mimeType });

export const clearPendingScan = () => {
  _base64 = null;
  _mimeType = 'image/jpeg';
};
