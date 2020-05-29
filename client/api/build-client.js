import axios from 'axios';

export default ({ req }) => {
  if (typeof window === 'undefined') {
    // we are on the server!
    return axios.create({
      baseURL: 'http://www.ticketing-app-prod-leonardo-gaston-rossi.xyz',
      headers: req.headers
    });
  } else {
    // we are on the client!
    console.log('WE ARE NO THE CLIENT');
    return axios.create({
      baseURL: '/'
    });
  }
};
