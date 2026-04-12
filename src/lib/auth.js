export function getUserId() {
  return localStorage.getItem('userId');
}

export function setUserId(id) {
  localStorage.setItem('userId', String(id));
}

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function setUserInfo(data) {
  localStorage.setItem('userId', String(data.userId));
  localStorage.setItem('token', data.token);
  localStorage.setItem('userName', data.name);
  localStorage.setItem('userEmail', data.email);
}

export function clearUserId() {
  localStorage.removeItem('userId');
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
}

export function isLoggedIn() {
  return !!getToken();
}

export function getUserName() {
  return localStorage.getItem('userName');
}