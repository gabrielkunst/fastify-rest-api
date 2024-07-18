import fastify from 'fastify';
import { env } from './env';

const app = fastify();

app.get('/', async (req,res) => {
  return res.status(200).send({ message: 'Hello World' });
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => console.log(`Server is running on http://localhost:${env.PORT}`));
