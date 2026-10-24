import { User } from '@hackathonfinder/db';
import { ApiError, badRequest, notFound, route } from '@/server/api';
import { loadMe } from '@/server/me';
import { readUpload, storeImage } from '@/server/storage';

const MAX_BYTES = 8 * 1024 * 1024;

/** JPG, PNG or WebP, judged by the file's first bytes rather than its name. */
function isPhoto(data: Buffer): boolean {
  const jpg = data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  const png = data.length > 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = data.length > 12 && data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP';
  return jpg || png || webp;
}

/** A square, face-centred 256px version of a Cloudinary upload; other URLs are used as they are. */
function squareFace(url: string): string {
  return /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)
    ? url.replace('/image/upload/', '/image/upload/c_fill,g_face,w_256,h_256,f_auto,q_auto/')
    : url;
}

/** Uploads a profile photo (multipart, field "photo"): JPG, PNG or WebP up to 8 MB. */
export const POST = route(
  async ({ req, user }) => {
    if (!(req.headers.get('content-type') ?? '').includes('multipart/form-data')) {
      throw badRequest('Send the photo as a file upload.');
    }
    // Refuse big bodies before reading them.
    if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES + 64 * 1024) {
      throw new ApiError(413, 'too_large', 'Use a photo under 8 MB.');
    }
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw badRequest('We couldn’t read that upload. Please try again.');
    }
    const data = await readUpload(form, 'photo');
    if (!data) throw badRequest('Choose a photo to upload.', { photo: 'Choose a photo.' });
    if (!isPhoto(data)) throw new ApiError(415, 'unsupported', 'Use a JPG, PNG or WebP photo.');

    const before = await User.findOne({ _id: user!.id, deletedAt: null }).select('_id').lean();
    if (!before) throw notFound('Your account');
    const stored = await storeImage(data, 'avatars');
    const image = squareFace(stored.url);
    await User.updateOne({ _id: user!.id }, { $set: { image } });
    return { image, user: await loadMe(user!.id) };
  },
  { auth: 'required', rate: { limit: 10, windowMs: 60 * 60_000, key: 'avatar-upload' } }
);

/** Removes the profile photo; the initials avatar shows instead. */
export const DELETE = route(
  async ({ user }) => {
    const res = await User.updateOne({ _id: user!.id, deletedAt: null }, { $unset: { image: 1 } });
    if (!res.matchedCount) throw notFound('Your account');
    return { image: null, user: await loadMe(user!.id) };
  },
  { auth: 'required', rate: { limit: 20, windowMs: 60 * 60_000, key: 'avatar-remove' } }
);
