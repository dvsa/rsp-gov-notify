import expect from 'expect';
import createResponse from '../../utils/createResponse';

describe('createResponse', () => {
	it('defaults to a 200 status and empty JSON body', () => {
		expect(createResponse({})).toEqual({
			statusCode: 200,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: '{}',
		});
	});

	it('uses the provided status code and stringifies the body', () => {
		const result = createResponse({ statusCode: 400, body: { message: 'bad request' } });

		expect(result.statusCode).toBe(400);
		expect(result.body).toBe(JSON.stringify({ message: 'bad request' }));
		expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
	});
});
