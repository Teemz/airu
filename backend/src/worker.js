const { Worker } = require('bullmq');

console.log('Worker started');

const worker = new Worker('doc-processing', async job => {
  // Your processing logic goes here
  console.log('Processing job:', job.id, job.data);
  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('Job completed:', job.id);
}, {
    connection: {
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379
    }
});

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});
