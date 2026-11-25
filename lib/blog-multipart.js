const Busboy = require('busboy');
const { COVER_MAX_BYTES } = require('./blogs');

/**
 * Parse multipart blog form: fields + optional cover image file.
 * Returns { fields, file: { buffer, filename, mimeType } | null }
 */
function parseBlogForm(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      reject(Object.assign(new Error('Expected multipart form data.'), { status: 400 }));
      return;
    }

    const fields = {};
    let fileInfo = null;
    const chunks = [];
    let fileTooLarge = false;

    const busboy = Busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: COVER_MAX_BYTES + 1024 }
    });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, stream, info) => {
      if (name !== 'cover' && name !== 'file') {
        stream.resume();
        return;
      }
      fileInfo = {
        filename: info.filename || 'cover.jpg',
        mimeType: info.mimeType || 'application/octet-stream'
      };
      stream.on('data', (chunk) => {
        if (fileTooLarge) return;
        chunks.push(chunk);
        const size = chunks.reduce((n, c) => n + c.length, 0);
        if (size > COVER_MAX_BYTES) {
          fileTooLarge = true;
          stream.resume();
        }
      });
      stream.on('limit', () => {
        fileTooLarge = true;
      });
    });

    busboy.on('error', (err) => {
      if (err && err.code === 'LIMIT_FILE_SIZE') {
        reject(Object.assign(new Error('Cover image must be 5 MB or smaller.'), { status: 400 }));
        return;
      }
      reject(err);
    });

    busboy.on('finish', () => {
      if (fileTooLarge) {
        reject(Object.assign(new Error('Cover image must be 5 MB or smaller.'), { status: 400 }));
        return;
      }
      resolve({
        fields,
        file: fileInfo
          ? {
              buffer: Buffer.concat(chunks),
              filename: fileInfo.filename,
              mimeType: fileInfo.mimeType
            }
          : null
      });
    });

    // Vercel may buffer body; Express provides a stream
    if (req.readable && !req.readableEnded) {
      req.pipe(busboy);
    } else if (Buffer.isBuffer(req.body)) {
      busboy.end(req.body);
    } else if (typeof req.body === 'string') {
      busboy.end(Buffer.from(req.body));
    } else {
      req.pipe(busboy);
    }
  });
}

module.exports = { parseBlogForm };
