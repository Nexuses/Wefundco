const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

let client;

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    const err = new Error(`${name} is not configured.`);
    err.status = 500;
    throw err;
  }
  return value;
}

function getConfig() {
  return {
    region: requiredEnv('AWS_REGION'),
    bucket: requiredEnv('S3_BUCKET'),
    accessKeyId: requiredEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: requiredEnv('AWS_SECRET_ACCESS_KEY'),
    publicBase: String(process.env.S3_PUBLIC_URL_BASE || '').trim().replace(/\/$/, '')
  };
}

function getClient() {
  if (client) return client;
  const { region, accessKeyId, secretAccessKey } = getConfig();
  client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey }
  });
  return client;
}

function publicUrlForKey(key) {
  const { region, bucket, publicBase } = getConfig();
  if (publicBase) return `${publicBase}/${key.split('/').map(encodeURIComponent).join('/')}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function keyFromUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  try {
    const { pathname } = new URL(raw);
    return decodeURIComponent(pathname.replace(/^\/+/, ''));
  } catch {
    return '';
  }
}

async function uploadBuffer({ key, body, contentType, metadata }) {
  const { bucket } = getConfig();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
      Metadata: metadata || undefined
    })
  );
  return {
    key,
    url: publicUrlForKey(key),
    bucket
  };
}

async function deleteObject(key) {
  if (!key) return;
  const { bucket } = getConfig();
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
}

async function getObjectStream(key) {
  const { bucket } = getConfig();
  const result = await getClient().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
  return {
    stream: result.Body,
    contentType: result.ContentType || 'application/octet-stream',
    contentLength: result.ContentLength
  };
}

module.exports = {
  uploadBuffer,
  deleteObject,
  getObjectStream,
  publicUrlForKey,
  keyFromUrl
};
