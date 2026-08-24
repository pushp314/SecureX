import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateUser, verifyAuthToken, getUserById } from './service';

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/api/v1/auth/login', async (request: FastifyRequest<{ Body: { email?: string; password?: string } }>, reply: FastifyReply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const session = authenticateUser(email, password);
    if (!session) {
      return reply.status(401).send({ error: 'Invalid email or security password' });
    }

    return reply.send(session);
  });

  // Current user profile
  fastify.get('/api/v1/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAuthToken(token);
    if (!decoded) {
      return reply.status(401).send({ error: 'Invalid or expired session token' });
    }

    const user = getUserById(decoded.sub);
    if (!user) {
      return reply.status(404).send({ error: 'User account not found' });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      avatarUrl: user.avatarUrl,
    });
  });

  // Logout
  fastify.post('/api/v1/auth/logout', async (_req, reply) => {
    return reply.send({ status: 'LOGGED_OUT', message: 'Session successfully terminated' });
  });
}
