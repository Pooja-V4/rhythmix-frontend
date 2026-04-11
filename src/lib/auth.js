export function getUserId() {
  return localStorage.getItem('userId');
}
export function setUserId(id) {
  localStorage.setItem('userId', String(id));
}
export function clearUserId() {
  localStorage.removeItem('userId');
}
export function isLoggedIn() {
  return !!getUserId();
}