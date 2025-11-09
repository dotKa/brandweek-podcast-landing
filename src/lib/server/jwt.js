import { SignJWT, jwtVerify } from 'jose';
import { JWT_SECRET } from '$env/static/private';

/**
 * JWT secret key'i encode et
 */
const getSecret = () => {
	return new TextEncoder().encode(JWT_SECRET);
};

/**
 * JWT token oluştur
 * @returns {Promise<string>} JWT token
 */
export async function createToken() {
	const secret = getSecret();
	
	const token = await new SignJWT({
		authenticated: true
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(secret);

	return token;
}

/**
 * JWT token'ı doğrula
 * @param {string} token - JWT token
 * @returns {Promise<{payload: object, protectedHeader: object} | null>} Token payload ve header veya null
 */
export async function verifyToken(token) {
	try {
		const secret = getSecret();
		
		const { payload, protectedHeader } = await jwtVerify(token, secret, {
			algorithms: ['HS256']
		});

		return { payload, protectedHeader };
	} catch (error) {
		// Token geçersiz veya expire olmuş
		return null;
	}
}

