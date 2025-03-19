export interface Env {}

type FIT_TYPE = 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
type FORMAT_TYPE = 'avif' | 'webp' | 'json' | 'jpeg' | 'png';
type OUTPUT_TYPE = 'thumbnail' | 'small' | 'medium' | 'large';

const ALLOWED_SOURCE_ORIGINS = ['blog-r2.jw1.dev'];

const OUTPUT_SIZES: { [key in OUTPUT_TYPE]: number } = {
	thumbnail: 150,
	small: 320,
	medium: 640,
	large: 1024,
};

interface ImageOptions {
	cf: {
		image: {
			fit?: FIT_TYPE;
			width?: number;
			height?: number;
			quality?: number;
			format?: FORMAT_TYPE;
		};
	};
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return handleRequest(request);
	},
};

async function handleRequest(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const options: ImageOptions = { cf: { image: {} } };

	const outputType = url.searchParams.get('type');
	const quality = url.searchParams.get('quality');

	if (outputType) {
		const size = OUTPUT_SIZES[outputType as OUTPUT_TYPE];
		options.cf.image.width = size;
		options.cf.image.height = size;
	}

	if (quality) {
		options.cf.image.quality = parseInt(quality, 10);
	}

	const accept = request.headers.get('Accept');
	if (accept && /image\/avif/.test(accept)) {
		options.cf.image.format = 'avif';
	} else if (accept && /image\/webp/.test(accept)) {
		options.cf.image.format = 'webp';
	}

	let imageURL = url.searchParams.get('image');
	if (!imageURL) return new Response('Missing "image" value', { status: 400 });
	imageURL = decodeURIComponent(imageURL);

	try {
		const { hostname } = new URL(imageURL);
		if (!ALLOWED_SOURCE_ORIGINS.includes(hostname)) {
			return new Response('Invalid source image URL', { status: 403 });
		}
	} catch (err) {
		return new Response('Invalid "image URL" value', { status: 400 });
	}

	const imageRequest = new Request(imageURL, {
		headers: request.headers,
	});

	return fetch(imageRequest, options);
}
