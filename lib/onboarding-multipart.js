const Busboy = require('busboy');
const { MAX_MB } = require('./onboarding-store');

const MAX_BYTES = MAX_MB * 1024 * 1024;

/**
 * Stream one file from multipart body into attachFileFn.
 * fieldId must be supplied separately (query or form field before file).
 */
function uploadOneFileFromRequest(req, submissionId, fieldId, attachFileFn) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      reject(Object.assign(new Error('Expected multipart form data.'), { status: 400 }));
      return;
    }

    if (!String(fieldId || '').trim()) {
      reject(Object.assign(new Error('fieldId is required.'), { status: 400 }));
      return;
    }

    let uploadPromise = null;

    const busboy = Busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: MAX_BYTES + 1024 }
    });

    busboy.on('file', (name, stream, info) => {
      if (name !== 'file') {
        stream.resume();
        return;
      }
      uploadPromise = attachFileFn(submissionId, fieldId, {
        filename: info.filename || 'upload',
        mimeType: info.mimeType || 'application/octet-stream',
        stream
      });
    });

    busboy.on('error', (err) => {
      if (err && err.code === 'LIMIT_FILE_SIZE') {
        reject(Object.assign(new Error(`Each file must be ${MAX_MB} MB or smaller.`), { status: 400 }));
        return;
      }
      reject(err);
    });

    busboy.on('finish', () => {
      (async () => {
        if (!uploadPromise) {
          reject(Object.assign(new Error('A file is required.'), { status: 400 }));
          return;
        }
        const entry = await uploadPromise;
        resolve(entry);
      })().catch(reject);
    });

    req.pipe(busboy);
  });
}

module.exports = { uploadOneFileFromRequest };
