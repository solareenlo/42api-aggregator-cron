const fetch = require('node-fetch');
const Bottleneck = require('bottleneck');

let APItoken = null;
const TOKEN_LIFETIME_IN_SECONDS = 7200;

const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 1000 / (process.env.FT_API_RATE_LIMIT_PER_SECOND || 1.8), // we don't set to 2s since sometimes api doesn't keep up
  reservoir: process.env.FT_API_RATE_LIMIT_PER_HOUR || 1200, // we don't set to 1200 for the same reason
  reservoirRefreshAmount: process.env.FT_API_RATE_LIMIT_PER_HOUR || 1200,
  reservoirRefreshInterval: 60 * 1000 * 60, // one hour
});

const isTokenExpired = () => {
  let currentDate = new Date();
  let tokenExpirationDate = new Date();

  if (APItoken) {
    tokenExpirationDate.setTime((APItoken.created_at + TOKEN_LIFETIME_IN_SECONDS) * 1000);
  }
  return (!APItoken || currentDate.getTime() > tokenExpirationDate.getTime());
};

const schedule = (prom) => limiter.schedule(() => prom());

const call = (endpoint, method, params, force) => {
  if (!force && isTokenExpired()) {
    return getToken()
      .then((token) => {
        APItoken = token;
        return call(endpoint, method, params);
      });
  }
  return new Promise((resolve, reject) => {
    let url = `${process.env.FT_API_ENDPOINT}${endpoint}`;
    if (params) {
      url += '?';
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          url += `${key}=${params[key]}&`;
        } else {
          url += `${key}&`;
        }
      });
    }
    let fetchHeaders = {};
    if (APItoken) {
      fetchHeaders.Authorization = `Bearer ${APItoken.access_token}`;
    }
    console.info('New Api Call', url);
    fetch(url, {
      method,
      headers: fetchHeaders,
      timeout: 25000, // 25 sec we are not to picky with 42Api
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error('42API said: ' + res.statusText + ' for ' + url);
        }
      })
      .then(json => {
        if (json.error) {
          return reject(json);
        }
        resolve(json);
      })
      .catch(err => reject(err));
  });
};

const getToken = () => call('/oauth/token', 'POST', {
  grant_type: 'client_credentials',
  client_id: process.env.FT_API_UID,
  client_secret: process.env.FT_API_SECRET,
}, true);

const getCampus = () => schedule(() => call('/v2/campus', 'GET', {
  'page[size]': 100,
}));

const getCoalitions = (page, size) => schedule(() => call('/v2/coalitions', 'GET', {
  'page[number]': page,
  'page[size]': size,
}));

const getCursus = () => schedule(() => call('/v2/cursus', 'GET', {
  'page[size]': 100,
}));

const getProjects = (page, size) => schedule(() => call('/v2/projects', 'GET', {
  'page[number]': page,
  'page[size]': size,
}));

const getSubProjects = (projectId) => schedule(() => call(`/v2/projects/${projectId}/projects`, 'GET', {
  'page[size]': 30,
}));


const getUsersCursus = (page, size) => schedule(() => call('/v2/cursus_users', 'GET', {
  'page[number]': page,
  'page[size]': size,
  'filter[end]': false,
}));

const getLocations = (page, size, start, end) => schedule(() => call('/v2/locations', 'GET', {
  sort: 'begin_at', // get older first
  'page[number]': page,
  'page[size]': size,
  'range[begin_at]': `${start},${end}`
}));

const getSpecificLocation = (id) => schedule(() => call(`/v2/locations/${id}`, 'GET'));

const usersCoalitions = (page, size) => schedule(() => call('/v2/coalitions_users', 'GET', {
  'page[number]': page,
  'page[size]': size,
}));

const usersCursus = (page, size) => schedule(() => call('/v2/cursus_users', 'GET', {
  'page[number]': page,
  'page[size]': size,
  'filter[end]': false,
}));

const apps = (page, size) => schedule(() => call('/v2/apps', 'GET', {
  'page[number]': page,
  'page[size]': size,
}));

const getUsers = (page, size, id) => schedule(() => call('/v2/users', 'GET', {
  'page[number]': page,
  'page[size]': size,
  'range[id]': `${id},${id + 10000}`
}));

const getUser = (id) => schedule(() => call(`/v2/users/${id}`, 'GET'));

module.exports = {
  getCampus,
  getCoalitions,
  getCursus,
  getProjects,
  getSubProjects,
  getUsersCursus,
  getLocations,
  getSpecificLocation,
  usersCoalitions,
  usersCursus,
  apps,
  getUsers,
  getUser,
};
