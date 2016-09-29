import buble from 'rollup-plugin-buble';

export default {
  dest: './dist/websocket.js',
  entry: 'index.js',
  format: 'cjs',
  external: [
    'events'
  ],
  plugins: [
    buble()
  ]
};
