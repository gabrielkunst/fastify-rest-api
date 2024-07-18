import fastify from 'fastify';

const app = fastify();

app.get('/', async (req,res) => {
  return res.status(200).send({ message: 'Hello World' });
})

app
  .listen({
    port: 3333,
  })
  .then(() => console.log('Server is running on http://localhost:3333'));
