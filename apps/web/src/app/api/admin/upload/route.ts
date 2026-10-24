import { badRequest } from '@/server/api';
import { adminRoute, audit } from '@/server/admin';
import { readUpload, storeImage } from '@/server/storage';

/**
 * Uploads a banner or poster (JPG, PNG, WebP or GIF, up to 8 MB) to Cloudinary and
 * returns its link. The editor puts the link in the listing; nothing changes until it's saved.
 */
export const POST = adminRoute(
  async ({ req, user }) => {
    if (!(req.headers.get('content-type') ?? '').startsWith('multipart/form-data')) throw badRequest('Send the image as a file upload.');
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw badRequest('That upload couldn’t be read. Try another image.');
    }
    const file = await readUpload(form, 'file');
    if (!file) throw badRequest('Pick an image to upload.');
    const stored = await storeImage(file, 'posters');
    await audit(user, 'image.upload', 'image', undefined, `Uploaded an image (${Math.round(file.length / 1024)} KB)`, { url: stored.url });
    return { url: stored.url };
  },
  { limit: 30, windowMs: 60_000 }
);
